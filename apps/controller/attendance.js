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
        .select('*')
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
    const todayPunchInElement = document.getElementById('today-punch-in');
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
            var date = new Date(attendanceState.date)
            punchDetElement.innerHTML = `<h6>Last Punch In at</h6><p>${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} - ${formatTime(attendanceState.check_in_time)}</p>`;
        }
    } else {
        punchInButton.style.display = 'block';
    }

    function formatTime(timeString) {
        const time = new Date(`1970-01-01T${timeString}Z`);
        const hours = time.getUTCHours().toString().padStart(2, '0');
        const minutes = time.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    

    async function updateTodayPunchIn() {
        const user = await getCurrentUser();
        if (!user) {
            todayPunchInElement.textContent = "User not logged in";
            return;
        }

        const { date } = getLocalTime();
        
        const { data, error } = await supabase
            .from('attendance')
            .select('check_in_time')
            .eq('id_user', user.id_user)
            .eq('date', date)
            .single();

        console.log(data)

        if (error || !data) {
            todayPunchInElement.textContent = "Not punch in yet today";
        } else {
            todayPunchInElement.textContent = `Today Punched In at ${data.check_in_time}`;
        }
    }

    updateTodayPunchIn();

    punchInButton.addEventListener('click', async () => {
        const { date, time } = getLocalTime();
        
        const { data, error } = await supabase
            .from('attendance')
            .insert([
                {
                    id_user: user.id_user,
                    date: date,
                    check_in_time: time,
                    attendance_type: "Live",
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
            $('#attendance-table').DataTable().destroy();
            displayAttendanceData();
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
    
            // const attendanceRecord = data[0]; // Ambil data pertama dari hasil 
            const attendanceState = await checkAttendanceState(user);
    
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
            statusButton.textContent = `You are ${attendanceState.status} today`;
            alert('Punched out successfully');
            $('#attendance-table').DataTable().destroy();
            displayAttendanceData();
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
            const punchOut = attendance.check_out_time ? convertTime(attendance.check_out_time) : 'Not Punch Out yet';
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(attendance.date)}</td>
                    <td>${convertTime(attendance.check_in_time)}</td>
                    <td>${punchOut}</td>
                    <td>${attendance.attendance_type}</td>
                    <td>${attendance.status}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        if ($.fn.DataTable.isDataTable('#attendance-table')) {
            $('#attendance-table').DataTable().destroy();
        }

        // Initialize DataTables
        $('#attendance-table').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            autoWidth: true,
            responsive: true,
            lengthChange: true,
            pageLength: 10,
            language: {
                emptyTable: "No data available in table",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "Showing 0 to 0 of 0 entries",
                infoFiltered: "(filtered from _MAX_ total entries)",
                lengthMenu: "Show _MENU_ entries",
                loadingRecords: "Loading...",
                processing: "Processing...",
                search: "Search:",
                zeroRecords: "No matching records found",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                }
            }
        });

    } catch (error) {
        console.error('Error displaying attendance data:', error.message);
    }
}

function convertTime(time) {
    const parts = time.split(':'); // Pisahkan waktu menjadi jam, menit, dan detik
    const hours = parts[0]; // Ambil bagian jam
    const minutes = parts[1]; // Ambil bagian menit
    return `${hours}:${minutes}`; // Gabungkan jam dan menit
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Reqeust Attendance
document.getElementById('attendance-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    const date = document.getElementById('add-date').value;
    const checkIn = document.getElementById('add-checkintime').value;
    const checkOut = document.getElementById('add-checkouttime').value;
    const description = document.getElementById('add-description').value;
    const attDate = date.split('/').reverse().join('-');

    const { data, error } = await supabase
        .from('attendance')
        .insert([
            { 
                id_user: currentUser.id_user, 
                date: attDate, 
                check_in_time: checkIn, 
                check_out_time: checkOut, 
                description: description, 
                status: 'Pending',
                attendance_type: "Request" 
            }
        ]);

    if (error) {
        console.error('Error inserting attendance data:', error);
        alert(`Error inserting attendance data: ${error.message}`);
        return;
    }

    alert('Attendance request submitted successfully');
    document.getElementById('attendance-form').reset();
    $('#request_attendance').modal('hide');
    $('#attendance-table').DataTable().destroy();
    displayAttendanceData();
});

document.addEventListener('DOMContentLoaded', () => {
    displayAttendanceData();
});
