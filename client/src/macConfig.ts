export const CLIENT_MAC_ADDRESS = "D4-93-90-39-28-EE";
export const socketConfig = {
    auth: { macAddress: CLIENT_MAC_ADDRESS || "default-mac-address" },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
};