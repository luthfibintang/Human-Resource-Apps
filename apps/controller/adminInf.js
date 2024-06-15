import { supabase } from '../config/supabaseClient.js'; // Import Supabase client


document.addEventListener('DOMContentLoaded', async () => {
    const loggedIn = window.localStorage.getItem('loggedIn');
    const id = window.localStorage.getItem('id');
    const role = window.localStorage.getItem('role')

    if (loggedIn !== 'true') {
        window.location.href = '../login.html';
    } else if(role !== 'Admin') {
        window.location.href = '../employee/dashboard.html'
    }else {
        // Fetch username based on id
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !userData) {
            console.error('Failed to fetch user data:', error);
        } else {
            document.getElementById('name').textContent = userData.name
        }
    }
});

window.logout = function() {
    // Hapus semua data localStorage
    window.localStorage.clear();
    // Redirect ke halaman login
    window.location.href = '../login.html';
}

export async function getCurrentUser() {
    const id = window.localStorage.getItem('id');
    if (!id) {
        return null;
    }

    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !userData) {
        console.error('Failed to fetch user data:', error);
        return null;
    }

    return userData;
}