import "server-only";
import swaggerJsdoc from "swagger-jsdoc";

export const getApiDocs = () => {
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "placeYface API",
        version: "1.0.0",
      },
      components: {
        schemas: {
          R2Image: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              thumbUrl: {
                type: "string",
              },
              fullUrl: {
                type: "string",
              },
              alt: {
                type: "string",
              },
            },
          },
        },
      },
    },
    apis: ["./app/api/images/route.ts"],
  };
  return swaggerJsdoc(options);
};
