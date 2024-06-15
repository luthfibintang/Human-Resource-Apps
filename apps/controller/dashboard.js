import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/userInf.js';

document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('name')
        .eq('id_user', currentUser.id_user)
        .single();

    if (error) {
        console.error('Error fetching user data:', error);
        alert(`Error fetching user data: ${error.message}`);
        return;
    }

    if (user) {
        document.getElementById('user_name').textContent = user.name;

        const dateNowElement = document.getElementById('date-now');
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        let formattedDate = now.toLocaleDateString('en-US', options);
        
        // Remove the comma before the year
        formattedDate = formattedDate.replace(/, (\d{4})/, ' $1');

        dateNowElement.textContent = formattedDate;
    } else {
        console.error('User not found');
        alert('User not found');
    }
});