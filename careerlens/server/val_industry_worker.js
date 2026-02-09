const http = require('http');

const TEST_USER_ID = 'test_worker_' + Date.now();
const HOST = 'localhost';
const PORT = 3000;

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTest() {
    console.log('Starting verification for Industry Worker Backend (Native HTTP)...');

    const testData = {
        userID: TEST_USER_ID,
        dob: '1990-01-01',
        address: '123 Industrial Way',
        pincode: '123456',
        city: 'Metropolis',
        companyName: 'Tech Corp',
        workLocation: 'Downtown',
        role: 'Senior Developer',
        domain: 'IT',
        skills: JSON.stringify(['JavaScript', 'Node.js', 'MongoDB']),
        experience: '5 years of full stack development',
        interestedRole: JSON.stringify(['Lead Developer', 'Architect']),
        education: 'B.Tech in Computer Science',
        currentCTC: '15 LPA',
        expectedCTC: '20 LPA'
    };

    try {
        // Test Create
        console.log(`\n1. Testing Create Profile for userID: ${TEST_USER_ID}`);
        const createRes = await makeRequest('/careerlens/industryWorker/create', 'POST', testData);
        console.log('Create Response Status:', createRes.status);
        console.log('Create Response Body:', createRes.body);

        if (!createRes.body.success) {
            throw new Error(`Create failed: ${createRes.body.message}`);
        }

        // Test Get
        console.log(`\n2. Testing Get Profile for userID: ${TEST_USER_ID}`);
        const getRes = await makeRequest(`/careerlens/industryWorker/${TEST_USER_ID}`, 'GET');
        console.log('Get Response Status:', getRes.status);
        console.log('Get Response Body:', getRes.body);

        if (!getRes.body.success) {
            throw new Error(`Get failed: ${getRes.body.message}`);
        }

        if (getRes.body.data.userID === TEST_USER_ID) {
            console.log('\nSUCCESS: Created and Retrieved Industry Worker Profile correctly.');
        } else {
            console.error('\nFAILURE: Retrieved data does not match created data.');
        }

    } catch (error) {
        console.error('\nTEST FAILED:', error.message || error);
    }
}

runTest();
