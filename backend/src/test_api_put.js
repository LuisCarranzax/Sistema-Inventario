async function testAllApi() {
  const states = ['en_revision', 'reparado', 'entregado', 'agendado', 'instalado'];
  console.log('Testing PUT API requests:');
  
  for (const state of states) {
    try {
      const response = await fetch(`http://localhost:4000/api/servicios/25/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: state })
      });
      const data = await response.json();
      console.log(`- State '${state}': Status ${response.status} -`, data);
    } catch (error) {
      console.log(`- State '${state}': Error - ${error.message}`);
    }
  }
}

testAllApi();
