/**
 * Calculate the optimal nitrogen content (ppm)
 * based on precipitation and temperature using
 * a Gaussian temperature response and sigmoid
 * precipitation adjustment.
 */
export interface OptimalNParams {
  baseOptimalN: number; // target N under ideal conditions (ppm)
  idealTemp: number; // °C at which uptake peaks
  tempStdDev: number; // standard deviation of temp response (°C)
  precipMidpoint: number; // mm at which leaching is half-max
  precipSteepness: number; // sigmoid steepness
}

const DEFAULT_OPTIMAL_N_PARAMS: OptimalNParams = {
  baseOptimalN: 100,
  idealTemp: 22,
  tempStdDev: 5,
  precipMidpoint: 50,
  precipSteepness: 0.1,
};

/**
 * Returns the optimal nitrogen level (ppm) for given
 * precipitation (mm) and temperature (°C).
 *
 * @param precipitation rainfall since last measurement (mm)
 * @param temperature   current average temperature (°C)
 * @param params        optional tuning parameters
 * @throws Error if precipitation is negative
 */
export function optimalNitrogenContent(
  precipitation: number,
  temperature: number,
  params: Partial<OptimalNParams> = {}
): number {
  if (precipitation < 0) {
    throw new Error("Precipitation must be ≥ 0");
  }
  const {
    baseOptimalN,
    idealTemp,
    tempStdDev,
    precipMidpoint,
    precipSteepness,
  } = { ...DEFAULT_OPTIMAL_N_PARAMS, ...params };

  // Gaussian temp response (0–1)
  const tempResponse = Math.exp(
    -Math.pow(temperature - idealTemp, 2) / (2 * Math.pow(tempStdDev, 2))
  );

  // Sigmoid precipitation adjustment (0–1)
  const precipResponse =
    precipitation > 0
      ? 1 / (1 + Math.exp(-precipSteepness * (precipitation - precipMidpoint)))
      : 0;

  // Effective optimal N
  return baseOptimalN * tempResponse * (1 - precipResponse);
}
