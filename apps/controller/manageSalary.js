import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from './userInf.js';

async function displayEmployeeSalary() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data: salaryData, error: salaryError } = await supabase
            .from('salary')
            .select('*');

        if (salaryError) {
            console.error('Error fetching salary data:', salaryError);
            return;
        }

        console.log('salary Data fetched:', salaryData);

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id_user, name, email, create_date')
            .in('id_user', salaryData.map(item => item.id_user));

        if (userError) {
            console.error('Error fetching users data:', userError);
            return;
        }

        console.log('Users Data fetched:', userData);

        const tbody = document.getElementById('salary-table-body');
        tbody.innerHTML = '';

        salaryData.forEach((salary) => {
            const user = userData.find(user => user.id_user === salary.id_user);
            const userName = user ? user.name : 'User Not Found'; // Jika tidak ada pengguna yang cocok, tampilkan pesan alternatif
            const approvedBy = salary.approved_by ? salary.approved_by : 'Not Approved yet';
            const userEmail = user ? user.email : 'Unknown';
            const userJoinDate = user ? formatDate(user.create_date) : 'Unknown';
            const row = `
                <tr>
                    <td>${userName}</td>
                    <td>${salary.id_user}</td>
                    <td>${userEmail}</td>
                    <td>${salary.net_salary}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(salary.status)}"></i> ${salary.status}
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item change-status" data-id="${salary.id_salary}" data-status="Approved" href="#"><i class="fa fa-dot-circle-o text-success"></i> Approved</a>
                                <a class="dropdown-item change-status" data-id="${salary.id_salary}" data-status="Declined" href="#"><i class="fa fa-dot-circle-o text-danger"></i> Declined</a>
                            </div>
                        </div>
                    </td>
                    <td><a class="btn btn-sm btn-primary" data-id="${salary.id_salary}" href="salary-view.html">Generate Slip</a></td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item update-btn" href="#" data-id="${salary.id_salary}" data-toggle="modal" data-target="#edit_leave"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-id="${salary.id_salary}" data-toggle="modal" data-target="#delete_approve"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
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
                const salaryID = event.target.dataset.id;
                const newStatus = event.target.dataset.status;
                await updateUserStatus(salaryID, newStatus);
            });
        });

        if ($.fn.DataTable.isDataTable('#salary-table')) {
            $('#salary-table').DataTable().destroy();
        }

        $('#salary-table').DataTable({
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

async function updateUserStatus(salaryID, newStatus) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('salary')
            .update({ 
                status: newStatus,
                approved_by: currentUser.name  // Menggunakan nama pengguna yang sedang login
            })
            .eq('id_salary', salaryID);

        if (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status');
            return;
        }

        $('#salary-table').DataTable().destroy();
        displaySalaryData();
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

// Insert
async function loadUserOptions() {
    try {
        // Fetch user data from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('id_user, name');

        if (error) {
            console.error('Error fetching users data:', error);
            return;
        }

        // Populate the select element with user options
        const selectStaff = document.getElementById('select-staff');
        selectStaff.innerHTML = ''; // Clear existing options
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id_user;
            option.text = user.name;
            selectStaff.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading user options:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayEmployeeSalary();
    loadUserOptions();
});

// Insert
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-salary');

    submitButton.addEventListener('click', async () => {
        const user = await getCurrentUser();
        if (!user) {
            alert('User not logged in');
            return;
        }

        const selectedStaff = document.getElementById('select-staff').value;
        const baseSalary = document.getElementById('base-salary').value;
        const allowance = document.getElementById('allowance').value;
        const deductions = document.getElementById('deductions').value;
        const bonus = document.getElementById('bonus').value;
        const payDate = document.getElementById('pay-date').value;
        const payPeriodStart = document.getElementById('pay-period-start').value;
        const payPeriodEnd = document.getElementById('pay-period-end').value;
        const comments = document.getElementById('comments').value;

        // Simple validation for required fields
        if (!selectedStaff || !baseSalary || !allowance || !deductions || !bonus || !payDate || !payPeriodStart || !payPeriodEnd) {
            alert('Please fill in all required fields');
            return;
        }

        // Convert date format if necessary (e.g., from d/m/y to y-m-d)
        const paydet = payDate.split('/').reverse().join('-');
        const paypers = payPeriodStart.split('/').reverse().join('-');
        const paypere = payPeriodEnd.split('/').reverse().join('-');

        try {
            const { data, error } = await supabase
                .from('salary')
                .insert([
                    {
                        id_user: selectedStaff,
                        base_salary: baseSalary,
                        allowance: allowance,
                        deductions: deductions,
                        bonus: bonus,
                        pay_date: paydet,
                        pay_period_start: paypers,
                        pay_period_end: paypere,
                        comments: comments
                    }
                ]);

            if (error) {
                console.error('Error adding salary:', error);
                alert('Failed to add salary');
            } else {
                alert('Salary data inserted successfully');
                $('#add_salary').modal('hide');
                document.getElementById('add-salary-form').reset();
                $('#salary-table').DataTable().destroy();
                displaySalaryData();
            }
        } catch (error) {
            console.error('Error inserting salary:', error.message);
        }
    });
});

