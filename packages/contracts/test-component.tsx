import React from 'react';
import { getAbi, getAddress, ContractName, DeploymentAddress } from './deployments/anvil/blitz/abis';

// Example React component that uses the Blitz ABI
const BlitzComponent: React.FC = () => {
  // Get the Blitz contract ABI and address
  const blitzAbi = getAbi('Blitz');
  const blitzAddress = getAddress('Blitz');
  
  // Example: Find specific functions from the ABI
  const startContestFunction = blitzAbi.find(
    (item) => item.type === 'function' && item.name === 'startContest'
  );
  
  const getBattleSummaryFunction = blitzAbi.find(
    (item) => item.type === 'function' && item.name === 'getBattleSummary'
  );

  return (
    <div>
      <h1>Blitz Contract Info</h1>
      <p><strong>Address:</strong> {blitzAddress}</p>
      <p><strong>ABI Items:</strong> {blitzAbi.length}</p>
      
      <h2>Key Functions</h2>
      {startContestFunction && (
        <div>
          <h3>Start Contest</h3>
          <p>Inputs: {startContestFunction.inputs?.length || 0}</p>
          <p>Outputs: {startContestFunction.outputs?.length || 0}</p>
        </div>
      )}
      
      {getBattleSummaryFunction && (
        <div>
          <h3>Get Battle Summary</h3>
          <p>Inputs: {getBattleSummaryFunction.inputs?.length || 0}</p>
          <p>Outputs: {getBattleSummaryFunction.outputs?.length || 0}</p>
        </div>
      )}
    </div>
  );
};

export default BlitzComponent;