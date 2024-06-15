import { supabase } from '../config/supabaseClient.js'; // Import Supabase client

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loggedIn = window.localStorage.getItem('loggedIn');
    const role = window.localStorage.getItem('role');

    // Jika pengguna sudah login, arahkan mereka ke halaman yang sesuai
    if (loggedIn && role) {
        if (loggedIn === 'true' || role === 'admin') {
            window.location.href = 'admin/dashboard-admin.html';
        } else if (loggedIn == 'true' || role === 'employee') {
            window.location.href = 'employee/dashboard.html';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
            
            const { data, error } = await supabase
                .from('users')
                .select("*")
                .eq("email", email)
                .eq("password", password)
                .single();

            if (error || !data) {
                console.log("Email atau Password salah");
                alert("Email atau Password salah");
            } else {
                console.log('Login successful:', data);

                console.log(data)
                
                // Gunakan localStorage untuk membuat login session
                window.localStorage.setItem('loggedIn', true);
                window.localStorage.setItem('id', data.id);
                window.localStorage.setItem('role', data.role); // Simpan peran pengguna

                if (data.role === 'Admin') {
                    window.location.href = 'admin/dashboard-admin.html'; // Redirect ke dashboard admin
                } else {
                    window.location.href = 'employee/dashboard.html'; // Redirect ke dashboard karyawan
                }
            }
        });
    }

    // Register
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(registerForm);
            const email = formData.get('email').toLowerCase();
            const role_name = formData.get('role_name');
            const password = formData.get('password');
            const passwordRepeat = formData.get('password-repeat');

            // Validasi repeat password
            if (password !== passwordRepeat) {
                alert('Passwords do not match');
                return;
            }

            // Tentukan prefix ID berdasarkan role
            const prefix = role_name === 'Admin' ? 'ADM' : 'EMP';

            // Ambil id_user terakhir dari database dengan prefix yang sesuai
            const { data: lastUser, error: lastUserError } = await supabase
                .from('users')
                .select('id_user')
                .like('id_user', `${prefix}_%`)
                .order('id_user', { ascending: false })
                .limit(1);

            if (lastUserError) {
                console.log("Failed to retrieve last user ID:", lastUserError.message);
                alert("Failed to retrieve last user ID");
                return;
            }
            
            // Generate id_user baru
            let newIdUser;
            if (lastUser && lastUser.length > 0) {
                const lastIdNumber = parseInt(lastUser[0].id_user.split('_')[1]);
                const newIdNumber = (lastIdNumber + 1).toString().padStart(5, '0');
                newIdUser = `${prefix}_${newIdNumber}`;
            } else {
                newIdUser = `${prefix}_00001`;
            }

            // Register user in the database
            const { data, error } = await supabase
                .from('users')
                .insert([{ id_user: newIdUser, email, role: role_name, password }]);

            if (error) {
                console.log("Registration failed:", error.message);
                alert("Registration failed: " + error.message);
            } else {
                alert("Registration successful! Please log in.");
                window.location.href = 'login.html'; // Redirect to login page upon successful registration
            }
        });
    }
});
