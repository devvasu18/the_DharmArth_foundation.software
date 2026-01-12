async function testLanguageUpdate() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: '9999999999',
                password: '123456'
            })
        });

        if (!loginRes.ok) {
            const err = await loginRes.json();
            throw new Error(`Login failed: ${JSON.stringify(err)}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login Successful. Token:', token.substring(0, 10) + '...');

        console.log("Updating language to 'en'...");
        const updateRes = await fetch('http://localhost:5000/api/users/language', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ language: 'en' })
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(`Update failed: ${JSON.stringify(err)}`);
        }

        const updateData = await updateRes.json();
        console.log('Update Successful:', updateData);

    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testLanguageUpdate();
