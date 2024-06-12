import { supabase } from '../config/supabaseClient.js'; // Import Supabase client

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    // const username = formData.get('username');
    const username = formData.get('username').toLowerCase();
    const password = formData.get('password');
    
    
    const { data, error } = await supabase
        .from('users')
        .select()
        .eq("username", username)
        .eq("password", password)
        .single()
    
    console.log(data)
});
