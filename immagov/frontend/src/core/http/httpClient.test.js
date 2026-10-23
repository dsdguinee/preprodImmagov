import axios from "axios";
import { createHttpClient } from "./httpClient";

jest.mock("axios");

const instanceAvec = (reponse) => {
  const instance = { get: jest.fn(reponse), post: jest.fn(reponse), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } };
  axios.create.mockReturnValue(instance);
  return instance;
};

test("ajoute le jeton, renvoie le corps de la réponse", async () => {
  instanceAvec(() => Promise.resolve({ data: { success: true } }));
  const client = createHttpClient({ baseURL: "http://api/", getToken: () => "abc" });
  await expect(client.get("/x")).resolves.toEqual({ success: true });
  const { baseURL, headers } = axios.create.mock.calls[0][0];
  expect(baseURL).toBe("http://api/");
  expect(headers).toMatchObject({ Authorization: "Bearer abc", "Content-Type": "application/json" });
});

test("sans jeton : pas d'en-tête Authorization ; une erreur est propagée", async () => {
  instanceAvec(() => Promise.reject(new Error("réseau")));
  const client = createHttpClient({ baseURL: "http://api/", getToken: () => null });
  await expect(client.post("/y", {})).rejects.toThrow("réseau");
  expect(axios.create.mock.calls[0][0].headers).not.toHaveProperty("Authorization");
});

test("instance multipart pour l'envoi de fichiers (utilisateur connecté)", () => {
  instanceAvec(() => Promise.resolve({ data: {} }));
  createHttpClient({ baseURL: "http://api/", getToken: () => "abc" }).instance({ multipart: true });
  expect(axios.create.mock.calls[0][0].headers["Content-Type"]).toBe("multipart/form-data");
});
