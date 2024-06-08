import { supabase } from '../config/supabaseClient.js'; // Import Supabase client


document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = window.localStorage.getItem('loggedIn');
    const id = window.localStorage.getItem('id');

    if (loggedIn !== 'true') {
        window.location.href = 'login.html';
    } else {
        // Fetch username based on id
        const { data: userData, error } = await supabase
            .from('users')
            .select('name')
            .eq('id', id)
            .single();

        if (error || !userData) {
            console.error('Failed to fetch user data:', error);
        } else {
            document.getElementById('name').textContent = userData.name
            document.getElementById('name-profile').textContent = userData.name
        }
    }
});

window.logout = function() {
    // Hapus semua data localStorage
    window.localStorage.clear();
    // Redirect ke halaman login
    window.location.href = 'login.html';
}