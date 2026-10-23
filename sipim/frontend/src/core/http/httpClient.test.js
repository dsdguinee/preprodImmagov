import axios from "axios";
import { createHttpClient } from "./httpClient";

jest.mock("axios");

const instanceAvec = (reponse) => {
  const instance = { get: jest.fn(reponse), post: jest.fn(reponse), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } };
  axios.create.mockReturnValue(instance);
  return instance;
};

test("ajoute le jeton, renvoie le corps de la réponse", async () => {
  instanceAvec(() => Promise.resolve({ data: { status: 200 } }));
  const client = createHttpClient({ baseURL: "http://api", getToken: () => "abc", onError: jest.fn() });
  await expect(client.get("/x")).resolves.toEqual({ status: 200 });
  expect(axios.create).toHaveBeenCalledWith({ baseURL: "http://api", headers: { Accept: "application/json", Authorization: "Bearer abc" } });
});

test("en cas d'erreur, la valeur vient de onError (dépendance injectée)", async () => {
  instanceAvec(() => Promise.reject(new Error("réseau")));
  const onError = jest.fn(() => "repli");
  const client = createHttpClient({ baseURL: "http://api", getToken: () => null, onError });
  await expect(client.post("/y", {})).resolves.toBe("repli");
  expect(onError).toHaveBeenCalled();
  expect(axios.create.mock.calls[0][0].headers).not.toHaveProperty("Authorization");
});
