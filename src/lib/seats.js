import api from "./axios";

/**
 * Get seats for a flight with lock information
 * @param {string} flightId - Flight ID
 * @returns {Promise<Object>} Seats data
 */
export const getFlightSeats = async (flightId) => {
  const { data } = await api.get(`/seats/flight/${flightId}`);
  return data;
};

/**
 * Admin: Manually unlock a seat (override)
 * @param {Object} params - Unlock parameters
 * @param {string} params.flightId - Flight ID
 * @param {string} params.seatNumber - Seat number
 * @returns {Promise<Object>} Unlock response
 */
export const adminUnlockSeat = async ({ flightId, seatNumber }) => {
  const { data } = await api.post("/seats/unlock", {
    flightId,
    seatNumber,
    // No sessionId needed for admin override
  });
  return data;
};
