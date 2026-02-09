document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const scrapeForm = document.getElementById('scrapeForm');
    const profileInput = document.getElementById('profileUrl');

    // Animation for entrance
    const card = document.querySelector('.glass-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    setTimeout(() => {
        card.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    // Login Handler
    loginBtn.addEventListener('click', async () => {
        // Add loading state effect
        const originalContent = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Check Browser...';
        loginBtn.style.opacity = '0.8';

        try {
            const response = await fetch('http://localhost:3000/api/login');
            const data = await response.json();

            if (data.success) {
                alert(data.message);
                // Switch buttons
                console.log("Login success. Switching buttons.");
                console.log("Disconnect Button:", disconnectBtn);

                if (loginBtn) loginBtn.style.display = 'none';
                if (disconnectBtn) {
                    disconnectBtn.style.display = 'flex';
                } else {
                    console.error("Disconnect button not found in DOM!");
                    alert("UI Error: Disconnect button missing. Please refresh the page.");
                }

                // Reset login button state for next time
                loginBtn.innerHTML = originalContent;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert('Error connecting to backend: ' + error.message);
            loginBtn.innerHTML = originalContent;
        } finally {
            if (loginBtn) loginBtn.style.opacity = '1';
        }
    });

    // Disconnect Handler
    disconnectBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to disconnect? This will close the browser.")) return;

        const originalContent = disconnectBtn.innerHTML;
        disconnectBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Disconnecting...';

        try {
            const response = await fetch('http://localhost:3000/api/logout', { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                alert("Disconnected successfully. You can now login with a new account.");
                // Reset buttons
                disconnectBtn.style.display = 'none';
                disconnectBtn.innerHTML = originalContent;
                loginBtn.style.display = 'flex';

                // Clear input
                profileInput.value = '';
            } else {
                alert('Disconnect failed: ' + data.error);
                disconnectBtn.innerHTML = originalContent;
            }
        } catch (error) {
            alert('Error disconnecting: ' + error.message);
            disconnectBtn.innerHTML = originalContent;
        }
    });

    // Form Submit Handler
    scrapeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = profileInput.value.trim();

        if (url) {
            const submitBtn = scrapeForm.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('http://localhost:3000/api/scrape', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                });

                const result = await response.json();

                if (result.success) {
                    console.log("Scraped Data:", result.data);
                    alert(`Scraping Successful!\n\nName: ${result.data.name}\nSee console for full details.`);
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                alert('Scraping failed: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
            }
        }
    });

    // Input animation improvements
    profileInput.addEventListener('input', () => {
        if (profileInput.value.length > 0) {
            profileInput.style.borderColor = 'var(--bg-mesh-2)';
        } else {
            profileInput.style.borderColor = 'var(--glass-border)';
        }
    });
});
