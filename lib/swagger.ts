import "server-only";
import spec from "../public/swagger.json";

export const getApiDocs = () => {
  return spec;
};
