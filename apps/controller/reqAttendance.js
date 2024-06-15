import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/userInf.js';

// Display Timeoff
async function displayAttendancefData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data: attendanceData, error: attendancefError } = await supabase
            .from('attendance')
            .select('*')
            .eq('attendance_type', 'Request'); // Perbaikan: Menggunakan , untuk pemisah field dan nilai

        if (attendancefError) {
            console.error('Error fetching attendance data:', attendancefError);
            return;
        }

        console.log('Attendance Data fetched:', attendanceData);

        const userIds = attendanceData.map(item => item.id_user); // Ambil semua id_user dari data kehadiran
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id_user, name')
            .in('id_user', userIds); // Mengambil data pengguna yang sesuai dengan id_user dari data kehadiran

        if (userError) {
            console.error('Error fetching users data:', userError);
            return;
        }

        console.log('Users Data fetched:', userData);

        const tbody = document.getElementById('attendance-table-body');
        tbody.innerHTML = '';

        attendanceData.forEach((attendance) => {
            const user = userData.find(user => user.id_user === attendance.id_user);
            const userName = user ? user.name : 'User Not Found'; // Jika tidak ada pengguna yang cocok, tampilkan pesan alternatif
            const approvedBy = attendance.approved_by ? attendance.approved_by : 'Not Approved yet';
            const row = `
                <tr>
                    <td>${userName}</td>
                    <td>${formatDate(attendance.date)}</td>
                    <td>${convertTime(attendance.check_in_time)}</td>
                    <td>${convertTime(attendance.check_out_time)}</td>
                    <td>${attendance.description}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(attendance.status)}"></i> ${attendance.status}
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item change-status" data-id="${attendance.id_attendance}" data-status="Approved" href="#"><i class="fa fa-dot-circle-o text-success"></i> Approved</a>
                                <a class="dropdown-item change-status" data-id="${attendance.id_attendance}" data-status="Declined" href="#"><i class="fa fa-dot-circle-o text-danger"></i> Declined</a>
                            </div>
                        </div>
                    </td>
                    <td>${approvedBy}</td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item update-btn" href="#" data-id="${attendance.id_attendance}" data-toggle="modal" data-target="#edit_leave"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-id="${attendance.id_attendance}" data-toggle="modal" data-target="#delete_approve"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        document.querySelectorAll('.change-status').forEach(item => {
            item.addEventListener('click', async (event) => {
                event.preventDefault();
                const attendanceID = event.target.dataset.id;
                const newStatus = event.target.dataset.status;
                await updateUserStatus(attendanceID, newStatus);
            });
        });

        if ($.fn.DataTable.isDataTable('#attendance-table')) {
            $('#attendance-table').DataTable().destroy();
        }

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


async function updateUserStatus(attendanceID, newStatus) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('attendance')
            .update({ 
                status: newStatus,
                approved_by: currentUser.name  // Menggunakan nama pengguna yang sedang login
            })
            .eq('id_attendance', attendanceID);

        if (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status');
            return;
        }

        $('#attendance-table').DataTable().destroy();
        displayAttendancefData()
    } catch (error) {
        console.error('Error during fetch operation:', error.message);
        alert('Failed to update user status due to a fetch error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function convertTime(time) {
    const parts = time.split(':'); // Pisahkan waktu menjadi jam, menit, dan detik
    const hours = parts[0]; // Ambil bagian jam
    const minutes = parts[1]; // Ambil bagian menit
    return `${hours}:${minutes}`; // Gabungkan jam dan menit
}

function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'text-warning';
        case 'approved':
            return 'text-success';
        case 'declined':
            return 'text-danger';
        default:
            return '';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    displayAttendancefData()
});

// // Update Timeoff
// document.addEventListener('DOMContentLoaded', () => {
//     const editButton = document.getElementById('update-timeoff');
//     const editLeaveModal = document.getElementById('edit_leave');

//     // When edit button is clicked, populate the edit form
//     document.getElementById('attendance-table-body').addEventListener('click', async (event) => {
//         if (event.target.closest('.update-btn')) {
//             const idTimeoff = event.target.closest('.update-btn').dataset.id;
//             const { data, error } = await supabase
//                 .from('timeoff')
//                 .select('*')
//                 .eq('id_timeoff', idTimeoff)
//                 .single();

//             if (error) {
//                 console.error('Error fetching timeoff data:', error);
//                 alert('Failed to fetch timeoff data');
//                 return;
//             }

//             document.getElementById('edit-timeoff-id').value = data.id_timeoff;
//             document.getElementById('edit-leave-type').value = data.timeoff_type;
//             document.getElementById('edit-timeoff-start').value = formatDateForInput(data.timeoff_start);
//             document.getElementById('edit-timeoff-end').value = formatDateForInput(data.timeoff_end);
//             document.getElementById('edit-leave-reason').value = data.reason;
//         }
//     });

//     function formatDateForInput(dateString) {
//         const dateParts = dateString.split('-');
//         return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
//     }

//     // When save button is clicked, update the timeoff
//     editButton.addEventListener('click', async (event) => {
//         event.preventDefault();

//         const idTimeoff = parseInt(document.getElementById('edit-timeoff-id').value);
//         const leaveType = document.getElementById('edit-leave-type').value;
//         let timeoffStart = document.getElementById('edit-timeoff-start').value;
//         let timeoffEnd = document.getElementById('edit-timeoff-end').value;
//         const leaveReason = document.getElementById('edit-leave-reason').value;

//         if (!leaveType || !timeoffStart || !timeoffEnd || !leaveReason) {
//             alert('Please fill in all required fields');
//             return;
//         }

//         // Convert date format from d/m/y to y-m-d
//         timeoffStart = timeoffStart.split('/').reverse().join('-');
//         timeoffEnd = timeoffEnd.split('/').reverse().join('-');

//         try {
//             const { data, error } = await supabase
//                 .from('timeoff')
//                 .update({
//                     timeoff_type: leaveType,
//                     timeoff_start: timeoffStart,
//                     timeoff_end: timeoffEnd,
//                     status: 'Pending',
//                     reason: leaveReason
//                 })
//                 .eq('id_timeoff', idTimeoff);

//             if (error) {
//                 console.error('Error updating timeoff data:', error);
//                 alert('Failed to update timeoff data');
//             } else {
//                 alert('Time off request updated successfully');
//                 $('#edit_leave').modal('hide');
//                 $('#attendance-table').DataTable().destroy();
//                 displayAttendancefData() // Refresh the data display after update
//             }
//         } catch (error) {
//             console.error('Error during fetch operation:', error.message);
//             alert('Failed to update time off due to a fetch error');
//         }
//     });
// });

// // Delete timeoff
// document.addEventListener('DOMContentLoaded', () => {
//     // displayAttendancefData()

//     // Event listener untuk tombol Delete di modal delete_approve
//     const deleteButton = document.querySelector('#delete_approve .continue-btn');
//     deleteButton.addEventListener('click', async () => {
//         const idTimeOff = parseInt(deleteButton.dataset.id); // Ambil id_timeoff dari dataset

//         try {
//             const { data, error } = await supabase
//                 .from('timeoff')
//                 .delete()
//                 .eq('id_timeoff', idTimeOff);

//             if (error) {
//                 console.error('Error deleting time off:', error);
//                 alert('Failed to delete time off');
//             } else {
//                 alert('Time off request deleted successfully');
//                 $('#delete_approve').modal('hide');
//                 $('#attendance-table').DataTable().destroy();
//                 displayAttendancefData() // Memperbarui tampilan data setelah penghapusan berhasil
//             }
//         } catch (error) {
//             console.error('Error during fetch operation:', error.message);
//             alert('Failed to delete time off due to a fetch error');
//         }
//     });

//     // Event listener untuk tombol Cancel di modal delete_approve
//     const cancelButton = document.querySelector('#delete_approve .cancel-btn');
//     cancelButton.addEventListener('click', () => {
//         $('#delete_approve').modal('hide');
//     });

//     // Event listener untuk menyiapkan modal delete_approve dengan data yang sesuai saat tombol delete di klik
//     document.getElementById('attendance-table-body').addEventListener('click', async (event) => {
//         if (event.target.closest('.dropdown-item[data-target="#delete_approve"]')) {
//             const idTimeoff = event.target.closest('.dropdown-item').dataset.id;
//             deleteButton.dataset.id = idTimeoff; // Set id_timeoff ke dataset untuk tombol Delete
//         }
//     });
// });

