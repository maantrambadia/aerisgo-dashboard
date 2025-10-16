import axios from "./axios";

/**
 * Get all airports
 */
export const getAllAirports = async () => {
  const response = await axios.get("/airports");
  return response.data.data;
};

/**
 * Get popular airports (for quick selection)
 */
export const getPopularAirports = async () => {
  const response = await axios.get("/airports/popular");
  return response.data.data;
};

/**
 * Search airports by query (code, city, name, state)
 */
export const searchAirports = async (query) => {
  if (!query || query.trim() === "") {
    return await getAllAirports();
  }
  const response = await axios.get(`/airports/search`, {
    params: { q: query },
  });
  return response.data.data;
};

/**
 * Get airport by code
 */
export const getAirportByCode = async (code) => {
  const response = await axios.get(`/airports/${code}`);
  return response.data.data;
};

/**
 * Format airport for display
 * Returns: "City (CODE)"
 */
export const formatAirport = (airport) => {
  return `${airport.city} (${airport.code})`;
};

/**
 * Format airport for select option
 */
export const formatAirportOption = (airport) => {
  return {
    value: airport.city,
    label: `${airport.city} (${airport.code})`,
    code: airport.code,
    ...airport,
  };
};
