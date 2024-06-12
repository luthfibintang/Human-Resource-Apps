import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from './userInf.js';

function getLocalTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const date = `${year}-${month}-${day}`;
    const time = `${hours}:${minutes}:${seconds}`;
        
    return { date, time };
}

// ATTANDANCE 
async function checkAttendanceState(user) {
    const { date } = getLocalTime();
    const { data, error } = await supabase
        .from('attendance')
        .select('check_in_time, check_out_time, status')
        .eq('id_user', user.id_user)
        .eq('date', date);

    if (error) {
        console.error('Error fetching attendance:', error);
        return null;
    }

    return data.length > 0 ? data[0] : null;
}

document.addEventListener("DOMContentLoaded", async function() {
    const user = await getCurrentUser();
    const punchInButton = document.getElementById('punch-in-btn');
    const punchOutButton = document.getElementById('punch-out-btn');
    const statusButton = document.getElementById('status-btn');
    const punchDetElement = document.querySelector('.punch-det');
    const punchHoursElement = document.querySelector('.punch-hours span');
    const now = new Date();
    const Allmonth = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const month = Allmonth[now.getMonth()]
    const day = now.getDay()
    const year = now.getFullYear()
    document.getElementById('date-now').textContent = `${day} ${month} ${year}`

    if (!user) {
        alert('User not logged in');
        return;
    }

    const attendanceState = await checkAttendanceState(user);
    
    punchInButton.style.display = 'none';
    punchOutButton.style.display = 'none';
    statusButton.style.display = 'none';

    if (attendanceState) {
        if (attendanceState.check_out_time) {
            statusButton.style.display = 'block';
            statusButton.textContent = `You are ${attendanceState.status} today`;
        } else {
            punchOutButton.style.display = 'block';
            punchDetElement.innerHTML = `<h6>Last Punch In at</h6><p>${new Date(attendanceState.check_in_time).toLocaleString()}</p>`;
        }
    } else {
        punchInButton.style.display = 'block';
    }

    punchInButton.addEventListener('click', async () => {
        const { date, time } = getLocalTime();
        
        const { data, error } = await supabase
            .from('attendance')
            .insert([
                {
                    id_user: user.id_user,
                    date: date,
                    check_in_time: time,
                    status: 'Present' // You can adjust this based on logic for status
                }
            ]);

        if (error) {
            console.error('Error punching in:', error);
            alert('Failed to punch in');
        } else {
            punchInButton.style.display = 'none';
            punchOutButton.style.display = 'block';
            punchDetElement.innerHTML = `<h6>Last Punch In at</h6><p>${new Date().toLocaleString()}</p>`;
            punchHoursElement.textContent = '0 hrs';
            alert('Punched in successfully');
        }
    });

    punchOutButton.addEventListener('click', async () => {
        try {
            // Ambil data kehadiran terlebih dahulu
            const { date } = getLocalTime();
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('id_user', user.id_user)
                .eq('date', date);
    
            if (error) {
                console.error('Error fetching attendance data:', error);
                throw new Error('Failed to fetch attendance data');
            }
    
            if (!data || data.length === 0) {
                console.error('No attendance data found');
                throw new Error('No attendance data found');
            }
    
            const attendanceRecord = data[0]; // Ambil data pertama dari hasil query
    
            // Lakukan punch-out setelah data berhasil diambil
            const { time } = getLocalTime();
            const { data: updatedData, error: updateError } = await supabase
                .from('attendance')
                .update({ check_out_time: time })
                .eq('id_user', user.id_user)
                .eq('date', date);
    
            if (updateError) {
                console.error('Error punching out:', updateError);
                throw new Error('Failed to punch out');
            }
    
            // Jika berhasil, perbarui tampilan tombol dan status
            punchOutButton.style.display = 'none';
            statusButton.style.display = 'block';
            alert('Punched out successfully');
        } catch (error) {
            console.error('Error punching out:', error);
            alert('Failed to punch out');
        }
    });
});

async function displayAttendanceData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('id_user', currentUser.id_user)
            .order('date', { ascending: false }); // Urutkan berdasarkan tanggal, terbaru ke terlama

        console.log(data)
        if (error) {
            console.error('Error fetching attendance data:', error);
            return;
        }

        const tbody = document.getElementById('attendance-table-body');
        tbody.innerHTML = ''; // Bersihkan isi tbody sebelum menambahkan baris baru

        data.forEach((attendance, index) => {
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(attendance.date)}</td>
                    <td>${attendance.check_in_time}</td>
                    <td>${attendance.check_out_time}</td>
                    <td>${attendance.status}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error displaying attendance data:', error.message);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
    displayAttendanceData();
});
