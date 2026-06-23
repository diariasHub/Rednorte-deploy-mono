import axios from "axios";

export const urgenciaApi = axios.create({
  baseURL: "/proxy/urgencias",
});
