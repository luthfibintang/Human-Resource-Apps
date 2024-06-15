import { supabase } from '../config/supabaseClient.js';
import { getCurrentUser } from '../controller/userInf.js';

async function displayReimbursementData() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('reimbursement')
            .select('*')
            .eq('id_user', currentUser.id_user);

        if (error) {
            console.error('Error fetching reimbursement data:', error);
            return;
        }

        console.log('Data fetched:', data); // Debugging: log data

        const tbody = document.getElementById('reimbursement-table-body');
        tbody.innerHTML = ''; // Clear the tbody before adding new rows

        data.forEach((reimbursement, index) => {
            const approvedBy = reimbursement.approved_by ? reimbursement.approved_by : 'Not Approved yet';
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formatDate(reimbursement.date)}</td>
                    <td>${reimbursement.name}</td>
                    <td>${reimbursement.amount}</td>
                    <td>${reimbursement.description}</td>
                    <td class="text-center">
                        <div class="action-label">
                            <a class="btn btn-white btn-sm btn-rounded">
                                <i class="fa fa-dot-circle-o ${getStatusIcon(reimbursement.status)}"></i> ${reimbursement.status}
                            </a>
                        </div>
                    </td>
                    <td>${approvedBy}</td>
                    <td class="text-right">
                        <div class="dropdown dropdown-action">
                            <a href="#" class="action-icon dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><i class="material-icons">more_vert</i></a>
                            <div class="dropdown-menu dropdown-menu-right">
                                <a class="dropdown-item view-attachment" href="#" data-id="${reimbursement.id_reimbursement}" data-toggle="modal" data-target="#view-attachment" ><i class="fa fa-file-o m-r-5"></i> Attachment</a>
                                <a class="dropdown-item update-btn" href="#" data-id="${reimbursement.id_reimbursement}" data-toggle="modal" data-target="#edit_reimbursement"><i class="fa fa-pencil m-r-5"></i> Edit</a>
                                <a class="dropdown-item" href="#" data-id="${reimbursement.id_reimbursement}" data-toggle="modal" data-target="#delete_reimbursement"><i class="fa fa-trash-o m-r-5"></i> Delete</a>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Destroy existing DataTable instance if it exists to avoid reinitialization issues
        if ($.fn.DataTable.isDataTable('#ReimbursementDatatable')) {
            $('#ReimbursementDatatable').DataTable().destroy();
        }

        // Initialize DataTables
        $('#ReimbursementDatatable').DataTable({
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
                const id_reimbursement = item.dataset.id;
                // console.log('View attachment for id_reimbursement:', idreimbursement);


                // Lakukan operasi selanjutnya di sini, misalnya panggil fungsi untuk menampilkan attachment
                await viewAttachment(id_reimbursement);
            });
        });

    } catch (error) {
        console.error('Error displaying reimbursement data:', error.message);
    }
}

// Fungsi unutk melakuakn preview
async function viewAttachment(id_reimbursement) {
    try {
        // Lakukan operasi untuk menampilkan attachment berdasarkan id_reimbursement
        const { data, error } = await supabase
            .from('reimbursement')
            .select('attachment')
            .eq('id_reimbursement', id_reimbursement)
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
        $('#view-attachment').modal('show');

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
document.getElementById('reimbursement-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
        alert('User not logged in');
        return;
    }

    const r_date = document.getElementById('reimbursement-date').value;
    const name = document.getElementById('reimbursement-name').value;
    const amount = document.getElementById('reimbursement-amount').value;
    const description = document.getElementById('reimbursement-description').value;
    const attachment = document.getElementById('reimbursement-attachment').files[0];
    const otDate = r_date.split('/').reverse().join('-');

    // console.log(hours); // Cetak nilai hours untuk memastikan nilainya

    let attachmentUrl = null;

    if (attachment) {
        const filePath = `reimbursement/${currentUser.id_user}/${Date.now()}_${attachment.name}`;
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

    const { data, error } = await supabase
        .from('reimbursement')
        .insert([
            { 
                id_user: currentUser.id_user, 
                date: otDate, 
                name: name, 
                amount: amount,
                description: description, 
                status: 'Pending', 
                approved_by: null, 
                attachment: attachmentUrl 
            }
        ]);

    if (error) {
        console.error('Error inserting reimbursement data:', error);
        alert(`Error inserting reimbursement data: ${error.message}`);
        return;
    }

    alert('reimbursement request submitted successfully');
    document.getElementById('reimbursement-form').reset();
    $('#add_reimbursement').modal('hide');
    $('#ReimbursementDatatable').DataTable().destroy();
    displayReimbursementData();
    updateReimbursementStatistics()
});

// Detele
document.addEventListener('DOMContentLoaded', () => {

    // Event listener untuk tombol Delete di modal delete_approve
    const deleteButton = document.querySelector('#delete_reimbursement .continue-btn');
    deleteButton.addEventListener('click', async () => {
        const id_reimbursement = parseInt(deleteButton.dataset.id); // Ambil id_reimbursement dari dataset

        try {
            // Ambil path attachment dari tabel reimbursement
            const { data: reimbursementData, error: fetchError } = await supabase
                .from('reimbursement')
                .select('attachment')
                .eq('id_reimbursement', id_reimbursement)
                .single();

            if (fetchError) {
                console.error('Error fetching attachment path:', fetchError);
                alert('Failed to fetch attachment path');
                return;
            }

            const attachmentPath = reimbursementData.attachment;
            
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

            // Hapus data dari tabel reimbursement
            const { error: deleteError } = await supabase
                .from('reimbursement')
                .delete()
                .eq('id_reimbursement', id_reimbursement);

            if (deleteError) {
                console.error('Error deleting reimbursement:', deleteError);
                alert('Failed to delete reimbursement');
            } else {
                alert('reimbursement request deleted successfully');
                $('#delete_reimbursement').modal('hide');
                $('#ReimbursementDatatable').DataTable().destroy();
                displayReimbursementData(); 
                updateReimbursementStatistics()
            }
        } catch (error) {
            console.error('Error during fetch operation:', error.message);
            alert('Failed to delete reimbursement due to a fetch error');
        }
    });

    // Event listener untuk tombol Cancel di modal delete_approve
    const cancelButton = document.querySelector('#delete_reimbursement .cancel-btn');
    cancelButton.addEventListener('click', () => {
        $('#delete_reimbursement').modal('hide');
    });

    // Event listener untuk menyiapkan modal delete_approve dengan data yang sesuai saat tombol delete di klik
    document.getElementById('reimbursement-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#delete_reimbursement"]')) {
            const id_reimbursement = event.target.closest('.dropdown-item').dataset.id;
            deleteButton.dataset.id = id_reimbursement; // Set id_reimbursement ke dataset untuk tombol Delete
        }
    });
});

// Update
document.addEventListener('DOMContentLoaded', () => {

    // Event listener untuk menyiapkan modal edit_reimbursement dengan data yang sesuai saat tombol edit di klik
    document.getElementById('reimbursement-table-body').addEventListener('click', async (event) => {
        if (event.target.closest('.dropdown-item[data-target="#edit_reimbursement"]')) {
            const id_reimbursement = event.target.closest('.dropdown-item').dataset.id;

            try {
                const { data: reimbursementData, error } = await supabase
                    .from('reimbursement')
                    .select('*')
                    .eq('id_reimbursement', id_reimbursement)
                    .single();

                if (error) {
                    console.error('Error fetching reimbursement data:', error);
                    alert('Failed to fetch reimbursement data');
                    return;
                }

                document.getElementById('edit-date').value = formatDateForInput(reimbursementData.date);
                document.getElementById('edit-name').value = reimbursementData.name;
                document.getElementById('edit-amount').value = reimbursementData.amount;
                document.getElementById('edit-description').value = reimbursementData.description;

                // Set id_attachment dan attachment path ke form data
                document.getElementById('edit-reimbursement-form').dataset.id = id_reimbursement;
                document.getElementById('edit-reimbursement-form').dataset.attachmentPath = reimbursementData.attachment;
            } catch (error) {
                console.error('Error during fetch operation:', error.message);
                alert('Failed to fetch reimbursement data due to a fetch error');
            }
        }
    });

    function formatDateForInput(dateString) {
        const dateParts = dateString.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        return formattedDate;
    }

    // Event listener untuk submit form edit_reimbursement
    document.getElementById('edit-reimbursement-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const id_reimbursement = parseInt(event.currentTarget.dataset.id);
        const previousAttachmentPath = event.currentTarget.dataset.attachmentPath;
        const pre_date = document.getElementById('edit-date').value;
        const name = document.getElementById('edit-name').value;
        const amount = document.getElementById('edit-amount').value;
        const description = document.getElementById('edit-description').value;
        const newAttachmentFile = document.getElementById('edit-attachment').files[0];

        const r_date = pre_date.split('/').reverse().join('-');

        try {
            let newAttachmentPath = previousAttachmentPath;

            console.log(previousAttachmentPath)

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
                const filePath = `reimbursement/${currentUser.id_user}/${Date.now()}_${newAttachmentFile.name}`;
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

            // Update data di tabel reimbursement
            const { error: updateError } = await supabase
                .from('reimbursement')
                .update({
                    date: r_date,
                    name: name,
                    amount: amount,
                    status: 'Pending',
                    description: description,
                    attachment: newAttachmentPath
                })
                .eq('id_reimbursement', id_reimbursement);

            if (updateError) {
                console.error('Error updating reimbursement data:', updateError);
                alert('Failed to update reimbursement data');
            } else {
                alert('reimbursement data updated successfully');
                $('#edit_reimbursement').modal('hide');
                $('#ReimbursementDatatable').DataTable().destroy();
                displayReimbursementData(); // Memperbarui tampilan data setelah update berhasil
                updateReimbursementStatistics()
            }
        } catch (error) {
            console.error('Error during update operation:', error.message);
            alert('Failed to update reimbursement data due to a fetch error');
        }
    });
});

async function updateReimbursementStatistics() {
    try {
        const currentUser = await getCurrentUser();
        const userId = currentUser.id_user;
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // getMonth() returns month from 0-11
        const year = currentDate.getFullYear();

        // Get Reimbursement Hours for this month
        const { data: monthlyReimbursement, error: monthlyReimbursementErr } = await supabase
            .from('reimbursement')
            .select('amount')
            .eq('id_user', userId)
            .eq('status', 'Approved')
            .gte('date', `${year}-${month.toString().padStart(2, '0')}-01`)
            .lt('date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

        if (monthlyReimbursementErr) {
            throw new Error('Error fetching overtime amount:', monthlyReimbursementErr.message);
        }

        const totalAmountReimbursement = monthlyReimbursement.reduce((acc, curr) => acc + curr.amount, 0);
        document.getElementById('reimbursement-count').innerText = totalAmountReimbursement.toLocaleString('id-ID');

        // Get Pending Requests
        const { data: pendingRequestsData, error: pendingRequestsError } = await supabase
            .from('reimbursement')
            .select('id_reimbursement')
            .eq('id_user', userId)
            .eq('status', 'Pending');

        if (pendingRequestsError) {
            throw new Error('Error fetching pending requests:', pendingRequestsError.message);
        }

        document.getElementById('pending-requests').innerText = pendingRequestsData.length;

        // Get Approved Requests
        const { data: approvedRequestsData, error: approvedRequestsError } = await supabase
            .from('reimbursement')
            .select('id_reimbursement')
            .eq('id_user', userId)
            .eq('status', 'Approved');

        if (approvedRequestsError) {
            throw new Error('Error fetching approved requests:', approvedRequestsError.message);
        }

        document.getElementById('approved-requests').innerText = approvedRequestsData.length;

        // Get Declined Requests
        const { data: DeclinedRequestsData, error: DeclinedRequestsError } = await supabase
            .from('reimbursement')
            .select('id_reimbursement')
            .eq('id_user', userId)
            .eq('status', 'Declined');

        if (DeclinedRequestsError) {
            throw new Error('Error fetching Declined requests:', DeclinedRequestsError.message);
        }

        document.getElementById('declined-requests').innerText = DeclinedRequestsData.length;
    } catch (error) {
        console.error('Error fetching reimbursement statistics:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayReimbursementData();
    updateReimbursementStatistics()
});