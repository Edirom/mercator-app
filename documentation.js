const { parse } = require("vue-docgen-api");

async function generateDocs() {
  const componentPath = "./src/components/CustomButton.vue";
  try {
    const doc = await parse(componentPath);
    console.log(doc); // Outputs JSON documentation
  } catch (error) {
    console.error("Error parsing component:", error);
  }
}

generateDocs();
