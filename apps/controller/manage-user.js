import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/adminInf.js';

// Display User
async function displayUserData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('Error fetching user data:', error);
            return;
        }

        console.log('Data fetched:', data); // Debugging: log data

        const tbody = document.getElementById('user-table-body');
        tbody.innerHTML = ''; // Clear the tbody before adding new rows

        data.forEach((allUser) => {
            console.log(allUser);
            const row = `
                <tr>
                    <td>${allUser.name}</td>
                    <td>${allUser.id_user}</td>
                    <td>${allUser.email}</td>
                    <td>${allUser.phone_number}</td>
                    <td><span class="badge ${getRoleIcon(allUser.role)}">${allUser.role}</span></td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(allUser.status)}"></i> ${allUser.status}
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item change-status" data-id="${allUser.id_user}" data-status="Active" href="#"><i class="fa fa-dot-circle-o text-success"></i> Active</a>
                                <a class="dropdown-item change-status" data-id="${allUser.id_user}" data-status="Inactive" href="#"><i class="fa fa-dot-circle-o text-danger"></i> Inactive</a>
                            </div>
                        </div>
                    </td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item update-btn" href="#" data-id="${allUser.id_user}" data-toggle="modal" data-target="#edit_user"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item delete-btn" href="#" data-id="${allUser.id_user}" data-toggle="modal" data-target="#delete_user"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Add event listener to change status
        document.querySelectorAll('.change-status').forEach(item => {
            item.addEventListener('click', async (event) => {
                event.preventDefault();
                const userId = event.target.dataset.id;
                const newStatus = event.target.dataset.status;
                await updateUserStatus(userId, newStatus);
            });
        });

        // Destroy existing DataTable instance if it exists to avoid reinitialization issues
        if ($.fn.DataTable.isDataTable('#user-table')) {
            $('#user-table').DataTable().destroy();
        }

        // Initialize DataTables
        $('#user-table').DataTable({
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
        console.error('Error displaying user data:', error.message);
    }
}

async function updateUserStatus(userId, newStatus) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id_user', userId);

        if (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status');
            return;
        }

        console.log('User status updated:', data);
        $('#user-table').DataTable().destroy();
        displayUserData(); // Refresh the table to reflect the new status
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
        case 'active':
            return 'text-success';
        case 'inactive':
            return 'text-danger';
        default:
            return '';
    }
}

function getRoleIcon(status) {
    switch (status.toLowerCase()) {
        case 'admin':
            return 'bg-inverse-info';
        case 'employee':
            return 'bg-inverse-success';
        default:
            return '';
    }
}

// Insert Data
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(registerForm);
            const name = formData.get('name');
            const email = formData.get('email').toLowerCase();
            const role_name = formData.get('role_name');
            const password = formData.get('password');
            const passwordRepeat = formData.get('password-repeat');
            const phone = formData.get('phone');

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
                .insert([{ id_user: newIdUser, name, email, phone_number: phone, role: role_name, password }]);

            if (error) {
                console.log("Registration failed:", error.message);
                alert("Registration failed: " + error.message);
            } else {
                alert("Registration successful! Please log in.");
                $('#add_user').modal('hide');
                registerForm.reset();
                $('#user-table').DataTable().destroy();
                displayUserData(); 
                // Redirect to login page upon successful registration
            }
        });
    }
});

// Update User
document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk menyiapkan modal edit_user dengan data yang sesuai saat tombol edit diklik
    document.getElementById('user-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#edit_user"]')) {
            const id_user = event.target.closest('.dropdown-item').dataset.id;

            try {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id_user', id_user)
                    .single();

                if (error) {
                    console.error('Error fetching user data:', error);
                    alert('Failed to fetch user data');
                    return;
                }

                document.getElementById('edit-user-name').value = userData.name;
                document.getElementById('edit-user-email').value = userData.email;
                document.getElementById('edit-user-phone').value = userData.phone_number;
                document.getElementById('edit-user-role').value = userData.role;

                // Set id_user ke form data
                document.getElementById('edit-user-form').dataset.id = id_user;
            } catch (error) {
                console.error('Error during fetch operation:', error.message);
                alert('Failed to fetch user data due to a fetch error');
            }
        }
    });

    // Event listener untuk submit form edit_user
    document.getElementById('edit-user-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const id_user = event.currentTarget.dataset.id;
        const name = document.getElementById('edit-user-name').value;
        const email = document.getElementById('edit-user-email').value;
        const phone = document.getElementById('edit-user-phone').value;
        const role = document.getElementById('edit-user-role').value;

        console.log(
            id_user,
            name,
            email,
            phone,
            role
        );

        try {
            // Update data di tabel users
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    name: name,
                    email: email,
                    phone_number: phone,
                    role: role
                })
                .eq('id_user', id_user);

            if (updateError) {
                console.error('Error updating user data:', updateError);
                alert('Failed to update user data');
            } else {
                alert('User data updated successfully');
                $('#edit_user').modal('hide');
                $('#user-table').DataTable().destroy();
                displayUserData(); // Memperbarui tampilan data setelah update berhasil
            }
        } catch (error) {
            console.error('Error during update operation:', error.message);
            alert('Failed to update user data due to a fetch error');
        }
    });
});

// Delete User
document.addEventListener('DOMContentLoaded', () => {

    // Event listener untuk tombol Delete di modal delete_user
    document.getElementById('delete_user').addEventListener('click', async (event) => {
        if (event.target.classList.contains('continue-btn')) {
            const userId = event.currentTarget.dataset.userId; // Mendapatkan userId dari dataset modal
            if (!userId) {
                console.error('User ID not found in modal dataset');
                alert('Failed to delete user');
                return;
            }

            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id_user', userId);

                if (error) {
                    console.error('Error deleting user:', error);
                    alert('Failed to delete user');
                } else {
                    alert('User deleted successfully');
                    $('#delete_user').modal('hide');
                    $('#user-table').DataTable().destroy();
                    displayUserData(); // Memperbarui tampilan data setelah penghapusan berhasil
                }
            } catch (error) {
                console.error('Error during delete operation:', error.message);
                alert('Failed to delete user due to a fetch error');
            }
        }
    });

    // Event listener untuk tombol Cancel di modal delete_user (tidak perlu aksi lain, cukup dismiss modal)
    document.getElementById('delete_user').addEventListener('click', (event) => {
        if (event.target.classList.contains('cancel-btn')) {
            $('#delete_user').modal('hide');
        }
    });

    // Function to set userId in delete_user modal and display the modal
    function setDeleteModalUserId(userId) {
        const modal = document.getElementById('delete_user');
        modal.dataset.userId = userId;
        $('#delete_user').modal('show');
    }

    // Event listener untuk tombol delete user pada tabel
    document.getElementById('user-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.delete-btn')) {
            const userId = event.target.closest('.delete-btn').dataset.id;
            if (userId) {
                setDeleteModalUserId(userId);
            }
        }
    });

});


document.addEventListener('DOMContentLoaded', () => {
    displayUserData();
});

