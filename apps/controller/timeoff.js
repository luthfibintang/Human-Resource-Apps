import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from './userInf.js';

// Display Timeoff
async function displayTimeOffData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('timeoff')
            .select('*')
            .eq('id_user', currentUser.id_user)

        console.log(data)

        if (error) {
            console.error('Error fetching timeoff data:', error);
            return;
        }

        const tbody = document.getElementById('timeoff-table-body');
        tbody.innerHTML = ''; // Bersihkan isi tbody sebelum menambahkan baris baru

        data.forEach((timeoff, index) => {
            const approvedBy = timeoff.approved_by ? timeoff.approved_by : 'Not Approved yet';
            const row = `
                <tr>
                    <td>${timeoff.timeoff_type}</td>
                    <td>${formatDate(timeoff.timeoff_start)}</td>
                    <td>${formatDate(timeoff.timeoff_end)}</td>
                    <td>${timeoff.reason}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(timeoff.status)}"></i> ${timeoff.status}
                            </a>
                        </div>
                    </td>
                    <td>${approvedBy}</td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item" href="#" data-toggle="modal" data-target="#edit_leave"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-toggle="modal" data-target="#delete_approve"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error displaying timeoff data:', error.message);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'new':
            return 'btn-purple';
        case 'approved':
            return 'btn-success';
        case 'declined':
            return 'btn-danger';
        default:
            return 'btn-default';
    }
}

function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'new':
            return 'text-purple';
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
