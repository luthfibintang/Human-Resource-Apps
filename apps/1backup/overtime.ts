import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/userInf.js';

async function displayOvertimeData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('overtime')
            .select('*')
            .eq('id_user', currentUser.id_user);

        if (error) {
            console.error('Error fetching overtime data:', error);
            return;
        }

        console.log('Data fetched:', data); // Debugging: log data

        const tbody = document.getElementById('overtime-table-body');
        tbody.innerHTML = ''; // Clear the tbody before adding new rows

        data.forEach((overtime, index) => {
            const approvedBy = overtime.approved_by ? overtime.approved_by : 'Not Approved yet';
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(overtime.ot_date)}</td>
                    <td>${overtime.ot_hours}</td>
                    <td>${overtime.description}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(overtime.status)}"></i> ${overtime.status}
                            </a>
                        </div>
                    </td>
                    <td>${approvedBy}</td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item view-attachment" href="#" data-id="${overtime.id_overtime}" data-toggle="modal" data-target="#view_OTAtchment" ><i class="fa fa-file-o m-r-5"></i> Attachment</a>
                                <a class="dropdown-item update-btn" href="#" data-id="${overtime.id_overtime}" data-toggle="modal" data-target="#edit_overtime"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-id="${overtime.id_overtime}" data-toggle="modal" data-target="#delete_overtime"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Destroy existing DataTable instance if it exists to avoid reinitialization issues
        if ($.fn.DataTable.isDataTable('#otDatatable')) {
            $('#otDatatable').DataTable().destroy();
        }

        // Initialize DataTables
        $('#otDatatable').DataTable({
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

        document.querySelectorAll('.view-attachment').forEach(item => {
            item.addEventListener('click', async (event) => {
                event.preventDefault();
                const idOvertime = item.dataset.id;
                console.log('View attachment for id_overtime:', idOvertime);


                // Lakukan operasi selanjutnya di sini, misalnya panggil fungsi untuk menampilkan attachment
                await viewAttachment(idOvertime);
            });
        });

    } catch (error) {
        console.error('Error displaying overtime data:', error.message);
    }
}

// Fungsi unutk melakuakn preview
async function viewAttachment(id_overtime) {
    try {
        // Lakukan operasi untuk menampilkan attachment berdasarkan id_overtime
        const { data, error } = await supabase
            .from('overtime')
            .select('attachment')
            .eq('id_overtime', id_overtime)
            .single();

        if (error) {
            console.error('Error fetching attachment:', error.message);
            return;
        }

        const attachmentUrl = data.attachment;
        console.log('Attachment URL:', attachmentUrl);

        // Tampilkan attachment dalam modal preview
        const previewImage = document.getElementById('previewImage');
        const previewLink = `https://rrsrdsjribaoconupozd.supabase.co/storage/v1/object/public/attachments/${attachmentUrl}`
        previewImage.src = previewLink;

        // Buka modal view attachment
        $('#view_OTAtchment').modal('show');

    } catch (error) {
        console.error('Error displaying attachment:', error.message);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
    displayOvertimeData();
});

// Insert Overtime
document.getElementById('overtime-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    const date = document.getElementById('overtime-date').value;
    const hours = parseFloat(document.getElementById('overtime-hours').value);
    const description = document.getElementById('overtime-description').value;
    const overtime_time = document.getElementById('overtime-hours').value;
    const attachment = document.getElementById('overtime-attachment').files[0];
    const otDate = date.split('/').reverse().join('-');

    let attachmentUrl = null;

    if (attachment) {
        const filePath = `overtime/${currentUser.id_user}/${Date.now()}_${attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('attachments')
            .upload(filePath, attachment);

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            alert(`Error uploading file: ${uploadError.message}`);
            return;
        }

        attachmentUrl = uploadData.path;
    }

    console.log(overtime_time)

    const { data, error } = await supabase
        .from('overtime')
        .insert([
            { 
                id_user: currentUser.id_user, 
                ot_date: otDate, 
                ot_hours: overtime_time, 
                description: description, 
                status: 'New', 
                approved_by: null, 
                attachment: attachmentUrl 
            }
        ]);

    if (error) {
        console.error('Error inserting overtime data:', error);
        alert(`Error inserting overtime data: ${error.message}`);
        return;
    }

    alert('Overtime request submitted successfully');
    document.getElementById('overtime-form').reset();
    $('#add_overtime').modal('hide');
    $('#otDatatable').DataTable().destroy();
    displayOvertimeData();
});

// Delete Overtime
// Delete Overtime
document.addEventListener('DOMContentLoaded', () => {

    // Event listener untuk tombol Delete di modal delete_approve
    const deleteButton = document.querySelector('#delete_overtime .continue-btn');
    deleteButton.addEventListener('click', async () => {
        const id_overtime = parseInt(deleteButton.dataset.id); // Ambil id_overtime dari dataset

        try {
            // Ambil path attachment dari tabel overtime
            const { data: overtimeData, error: fetchError } = await supabase
                .from('overtime')
                .select('attachment')
                .eq('id_overtime', id_overtime)
                .single();

            if (fetchError) {
                console.error('Error fetching attachment path:', fetchError);
                alert('Failed to fetch attachment path');
                return;
            }

            const attachmentPath = overtimeData.attachment;
            
            if (attachmentPath) {
                // Hapus file dari storage Supabase
                const { error: storageError } = await supabase
                    .storage
                    .from('attachments')
                    .remove([attachmentPath]);

                if (storageError) {
                    console.error('Error deleting file from storage:', storageError);
                    alert('Failed to delete attachment from storage');
                    return;
                }
            }

            // Hapus data dari tabel overtime
            const { error: deleteError } = await supabase
                .from('overtime')
                .delete()
                .eq('id_overtime', id_overtime);

            if (deleteError) {
                console.error('Error deleting overtime:', deleteError);
                alert('Failed to delete overtime');
            } else {
                alert('Overtime request deleted successfully');
                $('#delete_overtime').modal('hide');
                $('#otDatatable').DataTable().destroy();
                displayOvertimeData(); // Memperbarui tampilan data setelah penghapusan berhasil
            }
        } catch (error) {
            console.error('Error during fetch operation:', error.message);
            alert('Failed to delete overtime due to a fetch error');
        }
    });

    // Event listener untuk tombol Cancel di modal delete_approve
    const cancelButton = document.querySelector('#delete_overtime .cancel-btn');
    cancelButton.addEventListener('click', () => {
        $('#delete_overtime').modal('hide');
    });

    // Event listener untuk menyiapkan modal delete_approve dengan data yang sesuai saat tombol delete di klik
    document.getElementById('overtime-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#delete_overtime"]')) {
            const id_overtime = event.target.closest('.dropdown-item').dataset.id;
            deleteButton.dataset.id = id_overtime; // Set id_overtime ke dataset untuk tombol Delete
        }
    });
});

// Edit Overtime
document.addEventListener('DOMContentLoaded', () => {

    // Event listener untuk menyiapkan modal edit_overtime dengan data yang sesuai saat tombol edit di klik
    document.getElementById('overtime-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#edit_overtime"]')) {
            const id_overtime = event.target.closest('.dropdown-item').dataset.id;

            try {
                const { data: overtimeData, error } = await supabase
                    .from('overtime')
                    .select('*')
                    .eq('id_overtime', id_overtime)
                    .single();

                if (error) {
                    console.error('Error fetching overtime data:', error);
                    alert('Failed to fetch overtime data');
                    return;
                }

                document.getElementById('edit-ot-date').value = formatDateForInput(overtimeData.ot_date);
                document.getElementById('edit-ot-hours').value = overtimeData.ot_hours;
                document.getElementById('edit-description').value = overtimeData.description;

                // Set id_overtime dan attachment path ke form data
                document.getElementById('edit-overtime-form').dataset.id = id_overtime;
                document.getElementById('edit-overtime-form').dataset.attachmentPath = overtimeData.attachment;
            } catch (error) {
                console.error('Error during fetch operation:', error.message);
                alert('Failed to fetch overtime data due to a fetch error');
            }
        }
    });

    function formatDateForInput(dateString) {
        const dateParts = dateString.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        return formattedDate;
    }

    // Event listener untuk submit form edit_overtime
    document.getElementById('edit-overtime-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const id_overtime = parseInt(event.currentTarget.dataset.id);
        const previousAttachmentPath = event.currentTarget.dataset.attachmentPath;
        const preOT_date = document.getElementById('edit-ot-date').value;
        const ot_hours = document.getElementById('edit-ot-hours').value;
        const description = document.getElementById('edit-description').value;
        const newAttachmentFile = document.getElementById('edit-attachment').files[0];

        const ot_date = preOT_date.split('/').reverse().join('-');

        try {
            let newAttachmentPath = previousAttachmentPath;

            if (newAttachmentFile) {
                // Hapus file lama dari storage
                if (previousAttachmentPath) {
                    const { error: deleteError } = await supabase
                        .storage
                        .from('attachments')
                        .remove([previousAttachmentPath]);

                    if (deleteError) {
                        console.error('Error deleting previous attachment from storage:', deleteError);
                        alert('Failed to delete previous attachment from storage');
                        return;
                    }
                }

                // Upload file baru ke storage
                const currentUser = await getCurrentUser();
                const filePath = `overtime/${currentUser.id_user}/${Date.now()}_${newAttachmentFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('attachments')
                    .upload(filePath, newAttachmentFile);

                if (uploadError) {
                    console.error('Error uploading new attachment to storage:', uploadError);
                    alert('Failed to upload new attachment');
                    return;
                }

                newAttachmentPath = filePath; // Path dari file yang diunggah
            }

            // Update data di tabel overtime
            const { error: updateError } = await supabase
                .from('overtime')
                .update({
                    ot_date: ot_date,
                    ot_hours: ot_hours,
                    description: description,
                    attachment: newAttachmentPath
                })
                .eq('id_overtime', id_overtime);

            if (updateError) {
                console.error('Error updating overtime data:', updateError);
                alert('Failed to update overtime data');
            } else {
                alert('Overtime data updated successfully');
                $('#edit_overtime').modal('hide');
                $('#otDatatable').DataTable().destroy();
                displayOvertimeData(); // Memperbarui tampilan data setelah update berhasil
            }
        } catch (error) {
            console.error('Error during update operation:', error.message);
            alert('Failed to update overtime data due to a fetch error');
        }
    });
});


// Overtime Statistics
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const currentUser = await getCurrentUser(); // Assumed function to get the current logged-in user
        const userId = currentUser.id_user;
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // getMonth() returns month from 0-11
        const year = currentDate.getFullYear();

        // Get Overtime Hours for this month
        const { data: overtimeHoursData, error: overtimeHoursError } = await supabase
            .from('overtime')
            .select('ot_hours')
            .eq('id_user', userId)
            .gte('ot_date', `${year}-${month.toString().padStart(2, '0')}-01`)
            .lt('ot_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

        if (overtimeHoursError) {
            throw new Error('Error fetching overtime hours:', overtimeHoursError.message);
        }

        const totalOvertimeHours = overtimeHoursData.reduce((acc, curr) => acc + curr.ot_hours, 0);
        document.getElementById('overtime-hours').innerText = totalOvertimeHours;

        // Get Pending Requests
        const { data: pendingRequestsData, error: pendingRequestsError } = await supabase
            .from('overtime')
            .select('id_overtime')
            .eq('id_user', userId)
            .eq('status', 'New');

        if (pendingRequestsError) {
            throw new Error('Error fetching pending requests:', pendingRequestsError.message);
        }

        document.getElementById('pending-requests').innerText = pendingRequestsData.length;

        // Get Approved Requests
        const { data: approvedRequestsData, error: approvedRequestsError } = await supabase
            .from('overtime')
            .select('id_overtime')
            .eq('id_user', userId)
            .eq('status', 'Approved');

        if (approvedRequestsError) {
            throw new Error('Error fetching approved requests:', approvedRequestsError.message);
        }

        document.getElementById('approved-requests').innerText = approvedRequestsData.length;

        // Get Rejected Requests
        const { data: rejectedRequestsData, error: rejectedRequestsError } = await supabase
            .from('overtime')
            .select('id_overtime')
            .eq('id_user', userId)
            .eq('status', 'Rejected');

        if (rejectedRequestsError) {
            throw new Error('Error fetching rejected requests:', rejectedRequestsError.message);
        }

        document.getElementById('rejected-requests').innerText = rejectedRequestsData.length;
    } catch (error) {
        console.error('Error fetching overtime statistics:', error.message);
    }
});

// async function getCurrentUser() {
//     // Implement your logic to get the current logged-in user.
//     // This is a placeholder function.
//     return { id_user: 1 }; // Replace with actual user ID
// }






