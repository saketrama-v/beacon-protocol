async function main() {
  try {
    const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'neo@matrix.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const signalsRes = await fetch('http://localhost:3001/api/v1/dashboard/signals', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const signalsData = await signalsRes.json();
    console.log("DASHBOARD RETURNED:");
    console.log(JSON.stringify(signalsData, null, 2));
  } catch (e) {
    console.error(e);
  }
}

main();
