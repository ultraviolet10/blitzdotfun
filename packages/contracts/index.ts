console.log("Hello via Bun!");

// Test importing Blitz ABI from deployments
try {
  const { getAbi, getAddress, deployment, ContractName } = require('./deployments/anvil/blitz/abis');
  
  console.log("✅ Successfully imported ABI types!");
  
  // Test getting the Blitz ABI
  const blitzAbi = getAbi('Blitz');
  console.log("✅ Blitz ABI loaded:", blitzAbi.length, "items");
  
  // Test getting the address
  const blitzAddress = getAddress('Blitz');
  console.log("✅ Blitz address:", blitzAddress);
  
  // Test deployment object
  console.log("✅ Available contracts:", Object.keys(deployment));
  
  console.log("🎉 All ABI imports working correctly!");
  
} catch (error) {
  console.error("❌ Error importing ABIs:", error.message);
}