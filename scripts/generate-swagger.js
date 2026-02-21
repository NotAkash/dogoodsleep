const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

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
            key: { type: "string" },
            thumbUrl: { type: "string" },
            fullUrl: { type: "string" },
            alt: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./app/api/images/route.ts"],
};

const spec = swaggerJsdoc(options);
const outputPath = path.join(process.cwd(), 'public', 'swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`Swagger spec generated in ${outputPath}`);
