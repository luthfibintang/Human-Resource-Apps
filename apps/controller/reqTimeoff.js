import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/userInf.js';

// Display Timeoff
async function displayTimeOffData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data: timeoffData, error: timeoffError } = await supabase
            .from('timeoff')
            .select('*');

        if (timeoffError) {
            console.error('Error fetching timeoff data:', timeoffError);
            return;
        }

        console.log('Timeoff Data fetched:', timeoffData);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id_user, name')
            .in('id_user', timeoffData.map(item => item.id_user));

        if (userError) {
            console.error('Error fetching users data:', userError);
            return;
        }

        console.log('Users Data fetched:', userData);

        const tbody = document.getElementById('timeoff-table-body');
        tbody.innerHTML = '';

        timeoffData.forEach((timeoff) => {
            const user = userData.find(user => user.id_user === timeoff.id_user);
            const userName = user ? user.name : 'User Not Found'; // Jika tidak ada pengguna yang cocok, tampilkan pesan alternatif
            const approvedBy = timeoff.approved_by ? timeoff.approved_by : 'Not Approved yet';
            const row = `
                <tr>
                    <td>${userName}</td>
                    <td>${timeoff.timeoff_type}</td>
                    <td>${formatDate(timeoff.timeoff_start)}</td>
                    <td>${formatDate(timeoff.timeoff_end)}</td>
                    <td>${timeoff.reason}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(timeoff.status)}"></i> ${timeoff.status}
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item change-status" data-id="${timeoff.id_timeoff}" data-status="Approved" href="#"><i class="fa fa-dot-circle-o text-success"></i> Approved</a>
                                <a class="dropdown-item change-status" data-id="${timeoff.id_timeoff}" data-status="Declined" href="#"><i class="fa fa-dot-circle-o text-danger"></i> Declined</a>
                            </div>
                        </div>
                    </td>
                    <td>${approvedBy}</td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item update-btn" href="#" data-id="${timeoff.id_timeoff}" data-toggle="modal" data-target="#edit_leave"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-id="${timeoff.id_timeoff}" data-toggle="modal" data-target="#delete_approve"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
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
                const timeoffId = event.target.dataset.id;
                const newStatus = event.target.dataset.status;
                await updateUserStatus(timeoffId, newStatus);
            });
        });

        if ($.fn.DataTable.isDataTable('#timeoff-table')) {
            $('#timeoff-table').DataTable().destroy();
        }

        $('#timeoff-table').DataTable({
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
        console.error('Error displaying timeoff data:', error.message);
    }
}

async function updateUserStatus(timeoffId, newStatus) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('timeoff')
            .update({ 
                status: newStatus,
                approved_by: currentUser.name  // Menggunakan nama pengguna yang sedang login
            })
            .eq('id_timeoff', timeoffId);

        if (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status');
            return;
        }

        $('#timeoff-table').DataTable().destroy();
        displayTimeOffData();
    } catch (error) {
        console.error('Error during fetch operation:', error.message);
        alert('Failed to update user status due to a fetch error');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
    displayTimeOffData();
});

// Insert to timeoff
// document.addEventListener('DOMContentLoaded', () => {
//     const submitButton = document.getElementById('submit-timeoff');

//     submitButton.addEventListener('click', async () => {
//         const user = await getCurrentUser();
//         if (!user) {
//             alert('User not logged in');
//             return;
//         }

//         const leaveType = document.getElementById('leave-type').value;
//         let timeoffStart = document.getElementById('timeoff-start').value;
//         let timeoffEnd = document.getElementById('timeoff-end').value;
//         const leaveReason = document.getElementById('leave-reason').value;

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
//                 .insert([
//                     {
//                         id_user: user.id_user,
//                         timeoff_start: timeoffStart,
//                         timeoff_end: timeoffEnd,
//                         reason: leaveReason,
//                         status: 'Pending',
//                         timeoff_type: leaveType
//                     }
//                 ]);

//             if (error) {
//                 console.error('Error adding time off:', error);
//                 alert('Failed to add time off');
//             } else {
//                 alert('Time off request submitted successfully');
//                 $('#add_leave').modal('hide');
//                 document.getElementById('timeoff-form').reset();
//                 $('#timeoff-table').DataTable().destroy();
//                 displayTimeOffData();
//             }
//         } catch (error) {
//             console.error('Error during fetch operation:', error.message);
//             alert('Failed to add time off due to a fetch error');
//         }
//     });
// });

// Update Timeoff
document.addEventListener('DOMContentLoaded', () => {
    const editButton = document.getElementById('update-timeoff');
    const editLeaveModal = document.getElementById('edit_leave');

    // When edit button is clicked, populate the edit form
    document.getElementById('timeoff-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.update-btn')) {
            const idTimeoff = event.target.closest('.update-btn').dataset.id;
            const { data, error } = await supabase
                .from('timeoff')
                .select('*')
                .eq('id_timeoff', idTimeoff)
                .single();

            if (error) {
                console.error('Error fetching timeoff data:', error);
                alert('Failed to fetch timeoff data');
                return;
            }

            document.getElementById('edit-timeoff-id').value = data.id_timeoff;
            document.getElementById('edit-leave-type').value = data.timeoff_type;
            document.getElementById('edit-timeoff-start').value = formatDateForInput(data.timeoff_start);
            document.getElementById('edit-timeoff-end').value = formatDateForInput(data.timeoff_end);
            document.getElementById('edit-leave-reason').value = data.reason;
        }
    });

    function formatDateForInput(dateString) {
        const dateParts = dateString.split('-');
        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }

    // When save button is clicked, update the timeoff
    editButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const idTimeoff = parseInt(document.getElementById('edit-timeoff-id').value);
        const leaveType = document.getElementById('edit-leave-type').value;
        let timeoffStart = document.getElementById('edit-timeoff-start').value;
        let timeoffEnd = document.getElementById('edit-timeoff-end').value;
        const leaveReason = document.getElementById('edit-leave-reason').value;

        if (!leaveType || !timeoffStart || !timeoffEnd || !leaveReason) {
            alert('Please fill in all required fields');
            return;
        }

        // Convert date format from d/m/y to y-m-d
        timeoffStart = timeoffStart.split('/').reverse().join('-');
        timeoffEnd = timeoffEnd.split('/').reverse().join('-');

        try {
            const { data, error } = await supabase
                .from('timeoff')
                .update({
                    timeoff_type: leaveType,
                    timeoff_start: timeoffStart,
                    timeoff_end: timeoffEnd,
                    status: 'Pending',
                    reason: leaveReason
                })
                .eq('id_timeoff', idTimeoff);

            if (error) {
                console.error('Error updating timeoff data:', error);
                alert('Failed to update timeoff data');
            } else {
                alert('Time off request updated successfully');
                $('#edit_leave').modal('hide');
                $('#timeoff-table').DataTable().destroy();
                displayTimeOffData(); // Refresh the data display after update
            }
        } catch (error) {
            console.error('Error during fetch operation:', error.message);
            alert('Failed to update time off due to a fetch error');
        }
    });
});

// Delete timeoff
document.addEventListener('DOMContentLoaded', () => {
    // displayTimeOffData();

    // Event listener untuk tombol Delete di modal delete_approve
    const deleteButton = document.querySelector('#delete_approve .continue-btn');
    deleteButton.addEventListener('click', async () => {
        const idTimeOff = parseInt(deleteButton.dataset.id); // Ambil id_timeoff dari dataset

        try {
            const { data, error } = await supabase
                .from('timeoff')
                .delete()
                .eq('id_timeoff', idTimeOff);

            if (error) {
                console.error('Error deleting time off:', error);
                alert('Failed to delete time off');
            } else {
                alert('Time off request deleted successfully');
                $('#delete_approve').modal('hide');
                $('#timeoff-table').DataTable().destroy();
                displayTimeOffData(); // Memperbarui tampilan data setelah penghapusan berhasil
            }
        } catch (error) {
            console.error('Error during fetch operation:', error.message);
            alert('Failed to delete time off due to a fetch error');
        }
    });

    // Event listener untuk tombol Cancel di modal delete_approve
    const cancelButton = document.querySelector('#delete_approve .cancel-btn');
    cancelButton.addEventListener('click', () => {
        $('#delete_approve').modal('hide');
    });

    // Event listener untuk menyiapkan modal delete_approve dengan data yang sesuai saat tombol delete di klik
    document.getElementById('timeoff-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#delete_approve"]')) {
            const idTimeoff = event.target.closest('.dropdown-item').dataset.id;
            deleteButton.dataset.id = idTimeoff; // Set id_timeoff ke dataset untuk tombol Delete
        }
    });
});

