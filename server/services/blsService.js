// DEPENDENCIES
require("dotenv").config();

// BLS NATIONAL OEWS SERIES PREFIX
const NATIONAL_OEWS_PREFIX = "OEUN0000000000000";

/**
 * Converts an O*NET-SOC code into the six-digit BLS occupation code.
 *
 * Examples:
 * 15-1252.00 -> 151252
 * 15-1252.01 -> 151252
 *
 * The final O*NET extension, such as .00 or .01, is removed because
 * the BLS occupation code uses the underlying six-digit SOC code.
 *
 * @param {string} onetSocCode
 * @returns {string|null}
 */
function buildBlsOccupationCode(onetSocCode) {
  if (typeof onetSocCode !== "string") {
    return null;
  }

  const match = onetSocCode
    .trim()
    .match(/^(\d{2})-(\d{4})(?:\.\d{2})?$/);

  if (!match) {
    return null;
  }

  return `${match[1]}${match[2]}`;
}

/**
 * Builds a national, cross-industry OEWS series ID.
 *
 * Example:
 * BLS occupation code: 151252
 * Statistic code: 11
 * Result: OEUN000000000000015125211
 *
 * @param {string} blsOccupationCode Six-digit occupation code.
 * @param {string} statisticCode Two-character BLS wage statistic code.
 * @returns {string}
 */
function buildBlsSeriesId(
  blsOccupationCode,
  statisticCode
) {
  if (!/^\d{6}$/.test(blsOccupationCode || "")) {
    throw new Error(
      `Invalid BLS occupation code: ${blsOccupationCode}`
    );
  }

  if (!/^\d{2}$/.test(statisticCode || "")) {
    throw new Error(
      `Invalid BLS statistic code: ${statisticCode}`
    );
  }

  return (
    NATIONAL_OEWS_PREFIX +
    blsOccupationCode +
    statisticCode
  );
}

/**
 * Converts a projected employment-growth percentage into
 * the standard BLS outlook label.
 *
 * Use the current BLS Occupational Outlook Handbook categories.
 * These thresholds match the current BLS glossary.
 *
 * A missing growth percentage must return null. It must not
 * be converted to zero and described as "Little or No Change."
 *
 * @param {number|string|null|undefined} growthPercent
 * @returns {string|null}
 */
function getJobOutlook(growthPercent) {
  if (
    growthPercent === null ||
    growthPercent === undefined ||
    growthPercent === ""
  ) {
    return null;
  }

  const growth = Number(growthPercent);

  if (!Number.isFinite(growth)) {
    return null;
  }

  if (growth >= 7) {
    return "Much Faster than Average";
  }

  if (growth >= 5) {
    return "Faster than Average";
  }

  if (growth >= 3) {
    return "As Fast as Average";
  }

  if (growth >= 1) {
    return "Slower than Average";
  }

  if (growth > -1) {
    return "Little or No Change";
  }

  return "Decline";
}


/**
 * Returns true when the cached BLS data is still fresh.
 *
 * @param {Date|string|null} updatedAt
 * @param {number} maxAgeDays
 * @returns {boolean}
 */
function isCacheFresh(updatedAt, maxAgeDays = 30) {
  if (!updatedAt) {
    return false;
  }

  const updatedTime = new Date(updatedAt).getTime();

  if (Number.isNaN(updatedTime)) {
    return false;
  }

  const maxAgeMilliseconds =
    maxAgeDays * 24 * 60 * 60 * 1000;

  return Date.now() - updatedTime < maxAgeMilliseconds;
}

/**
 * Retrieves BLS time-series values.
 *
 * @param {string[]} seriesIds
 * @param {number} startYear
 * @param {number} endYear
 * @returns {Promise<Map<string, number>>}
 */
async function fetchBlsSeriesValues(
  seriesIds,
  startYear,
  endYear
) {
  if (!Array.isArray(seriesIds) || seriesIds.length === 0) {
    throw new Error(
      "At least one BLS series ID is required."
    );
  }

  const body = {
    seriesid: seriesIds,
    startyear: String(startYear),
    endyear: String(endYear),
  };

  // A BLS registration key is optional for smaller requests.
  // When supplied, it allows higher API request limits.
  if (process.env.BLS_API_KEY) {
    body.registrationkey = process.env.BLS_API_KEY;
  }

  const response = await fetch(
    "https://api.bls.gov/publicAPI/v2/timeseries/data/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      `BLS request failed with status ${response.status}.`
    );
  }

  const payload = await response.json();

  if (payload.status !== "REQUEST_SUCCEEDED") {
    const messages = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : "Unknown BLS API error.";

    throw new Error(messages);
  }

  const values = new Map();

  for (const series of payload.Results?.series || []) {
    // OEWS annual values use the A01 period.
    // Sort by year so the newest available annual value is selected.
    const latestAnnualValue = (series.data || [])
      .filter((item) => item.period === "A01")
      .sort(
        (a, b) => Number(b.year) - Number(a.year)
      )[0];

    if (!latestAnnualValue) {
      continue;
    }

    const numericValue = Number(
      String(latestAnnualValue.value).replace(/,/g, "")
    );

    if (!Number.isNaN(numericValue)) {
      values.set(series.seriesID, numericValue);
    }
  }

  return values;
}

/**
 * Retrieves the 10th- and 90th-percentile annual wages
 * for one career role.
 *
 * If blsOccupationCode has already been saved, use it.
 * Otherwise, attempt to derive it from the O*NET-SOC code.
 *
 * The complete BLS series IDs are created from:
 *
 * BLS national OEWS prefix
 * + six-digit BLS occupation code
 * + two-character wage statistic code
 *
 * @param {{
 *   onetSocCode: string,
 *   blsOccupationCode?: string|null,
 *   annual10thPercentileSeriesCode: string,
 *   annual90thPercentileSeriesCode: string
 * }} careerRole
 * @returns {Promise<{
 *   blsOccupationCode: string,
 *   annual10thPercentileSeriesId: string,
 *   annual90thPercentileSeriesId: string,
 *   salaryMin: number|null,
 *   salaryMax: number|null
 * }>}
 */
async function fetchCareerSalaryData(careerRole) {
  const blsOccupationCode =
    careerRole.blsOccupationCode ||
    buildBlsOccupationCode(careerRole.onetSocCode);

  if (!blsOccupationCode) {
    throw new Error(
      `Unable to create a BLS occupation code from ${careerRole.onetSocCode}.`
    );
  }

  const annual10thPercentileSeriesId =
    buildBlsSeriesId(
      blsOccupationCode,
      careerRole.annual10thPercentileSeriesCode
    );

  const annual90thPercentileSeriesId =
    buildBlsSeriesId(
      blsOccupationCode,
      careerRole.annual90thPercentileSeriesCode
    );

  const currentYear = new Date().getFullYear();

  // OEWS data usually trails the current calendar year.
  // Request several recent years and select the newest annual value.
  const values = await fetchBlsSeriesValues(
    [
      annual10thPercentileSeriesId,
      annual90thPercentileSeriesId,
    ],
    currentYear - 3,
    currentYear
  );

  return {
    blsOccupationCode,

    annual10thPercentileSeriesId,
    annual90thPercentileSeriesId,

    salaryMin:
      values.get(annual10thPercentileSeriesId) ?? null,

    salaryMax:
      values.get(annual90thPercentileSeriesId) ?? null,
  };
}

// EXPORTS
module.exports = {
  buildBlsOccupationCode,
  buildBlsSeriesId,
  getJobOutlook,
  fetchBlsSeriesValues,
  fetchCareerSalaryData,
  isCacheFresh,
};