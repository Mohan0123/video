document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const addEduBtn = document.getElementById('addEducation');
    const eduContainer = document.getElementById('education-entries');
    const addExpBtn = document.getElementById('addExperience');
    const expContainer = document.getElementById('experience-entries');
    const generateBtn = document.getElementById('generateBtn');

    // --- Helpers ---
    const getVal = (id) => document.getElementById(id)?.value.trim() || '';
    const getRadioVal = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

    // Set Current Date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('date').value = dateStr;
    document.getElementById('dob').value = "2000-01-01"; // Default example

    // --- Dynamic Fields ---

    // Education Template
    const createEduEntry = () => {
        const div = document.createElement('div');
        div.className = 'dynamic-entry';
        div.innerHTML = `
            <button type="button" class="remove-btn" aria-label="Remove Entry" onclick="this.parentElement.remove()"><i class="fa-solid fa-times"></i></button>
            <div class="form-grid">
                <div class="form-group">
                    <label>Degree/Exam</label>
                    <input type="text" class="edu-exam" placeholder="e.g. B.Tech / 12th">
                </div>
                <div class="form-group">
                    <label>University/Board</label>
                    <input type="text" class="edu-board" placeholder="e.g. Oxford University">
                </div>
                <div class="form-group">
                    <label>Year</label>
                    <input type="number" class="edu-year" placeholder="2024">
                </div>
                <div class="form-group">
                    <label>Grade/CGPA</label>
                    <input type="text" class="edu-grade" placeholder="e.g. 9.0 CGPA">
                </div>
            </div>
        `;
        eduContainer.appendChild(div);
    };

    // Experience Template
    const createExpEntry = () => {
        const div = document.createElement('div');
        div.className = 'dynamic-entry';
        div.innerHTML = `
            <button type="button" class="remove-btn" aria-label="Remove Entry" onclick="this.parentElement.remove()"><i class="fa-solid fa-times"></i></button>
            <div class="form-grid">
                <div class="form-group">
                    <label>Job Title</label>
                    <input type="text" class="exp-title" placeholder="e.g. Senior Developer">
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" class="exp-company" placeholder="e.g. Tech Corp">
                </div>
                <div class="form-group full-width">
                    <label>Description (Key achievements)</label>
                    <textarea class="exp-desc" rows="2" placeholder="Led a team of 5 developers..."></textarea>
                </div>
            </div>
        `;
        expContainer.appendChild(div);
    };

    // Initialize with one empty field
    createEduEntry();

    // Event Listeners
    addEduBtn.addEventListener('click', createEduEntry);
    addExpBtn.addEventListener('click', createExpEntry); // Start with 0 experience

    // --- PDF Generation Logic ---
    generateBtn.addEventListener('click', () => {
        const name = getVal('name');
        if (!name) {
            alert('Please enter your Full Name to generate the resume.');
            document.getElementById('name').focus();
            return;
        }

        const originalBtnText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        // Collect Data
        const data = {
            personal: {
                name: name,
                mobile: getVal('mobile'),
                email: getVal('email'),
                address: getVal('address'),
                dob: getVal('dob'),
                father: getVal('fatherName'),
                gender: getRadioVal('gender'),
                details: [
                    { label: "Father's Name", val: getVal('fatherName') },
                    { label: "Date of Birth", val: getVal('dob') },
                    { label: "Gender", val: getRadioVal('gender') },
                    { label: "Marital Status", val: getRadioVal('maritalStatus') },
                    { label: "Nationality", val: getVal('nationality') },
                    { label: "Religion", val: getVal('religion') },
                ].filter(i => i.val)
            },
            education: Array.from(document.querySelectorAll('.edu-exam')).map((el, i) => ({
                exam: el.value,
                board: document.querySelectorAll('.edu-board')[i].value,
                year: document.querySelectorAll('.edu-year')[i].value,
                grade: document.querySelectorAll('.edu-grade')[i].value
            })).filter(e => e.exam),
            experience: Array.from(document.querySelectorAll('.exp-title')).map((el, i) => ({
                title: el.value,
                company: document.querySelectorAll('.exp-company')[i].value,
                desc: document.querySelectorAll('.exp-desc')[i].value
            })).filter(e => e.title),
            skills: getVal('skills').split('\n').filter(s => s.trim()),
            objective: getVal('objective'),
            declaration: getVal('declaration'),
            meta: {
                place: getVal('place'),
                date: getVal('date')
            }
        };

        // Create Container for PDF Generation (Off-screen)
        const pdfContainer = document.createElement('div');
        pdfContainer.id = 'pdf-container';
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.top = '-9999px';
        pdfContainer.style.left = '0';
        pdfContainer.style.width = '210mm'; // A4 width
        pdfContainer.style.background = '#fff';
        pdfContainer.style.color = '#333';

        // PDF Content Template
        pdfContainer.innerHTML = `
            <style>
                .pdf-wrapper { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.5; padding: 40px; }
                .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
                .header h1 { margin: 0; font-size: 28px; text-transform: uppercase; color: #1e293b; letter-spacing: 1px; }
                .contact-info { margin-top: 8px; font-size: 14px; color: #555; }
                
                .section { margin-bottom: 25px; }
                .section-title { 
                    font-size: 16px; font-weight: bold; text-transform: uppercase; 
                    color: #2563eb; border-bottom: 1px solid #e2e8f0; 
                    padding-bottom: 5px; margin-bottom: 15px; 
                }
                
                table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 10px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: 600; text-align: center; }
                td.center { text-align: center; }

                .job-block { margin-bottom: 15px; }
                .job-title { font-weight: bold; font-size: 15px; color: #1e293b; }
                .job-company { font-style: italic; color: #64748b; margin-bottom: 4px; }
                
                .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
                .skill-badge { background: #eff6ff; padding: 4px 8px; border-radius: 4px; font-size: 13px; border: 1px solid #bfdbfe; color: #1e40af; }

                .profile-table td { border: none; border-bottom: 1px dotted #e2e8f0; padding: 6px 0; }
                .profile-label { font-weight: 600; width: 150px; }

                .footer { margin-top: 40px; font-size: 14px; display: flex; justify-content: space-between; }
            </style>
            
            <div class="pdf-wrapper">
                <div class="header">
                    <h1>${data.personal.name}</h1>
                    <div class="contact-info">
                        ${data.personal.address ? `<span>${data.personal.address}</span><br>` : ''}
                        ${data.personal.mobile ? `<span><strong>Mobile:</strong> ${data.personal.mobile}</span>` : ''} 
                        ${data.personal.email ? ` | <span><strong>Email:</strong> ${data.personal.email}</span>` : ''}
                    </div>
                </div>

                ${data.objective ? `
                <div class="section">
                    <div class="section-title">Career Objective</div>
                    <div>${data.objective}</div>
                </div>` : ''}

                ${data.experience.length > 0 ? `
                <div class="section">
                    <div class="section-title">Work Experience</div>
                    ${data.experience.map(exp => `
                        <div class="job-block">
                            <div class="job-title">${exp.title}</div>
                            <div class="job-company">${exp.company}</div>
                            <div>${exp.desc.replace(/\n/g, '<br>')}</div>
                        </div>
                    `).join('')}
                </div>` : ''}

                ${data.education.length > 0 ? `
                <div class="section">
                    <div class="section-title">Education</div>
                    <table>
                        <thead>
                            <tr><th>Qualification</th><th>Board/University</th><th>Year</th><th>Grade</th></tr>
                        </thead>
                        <tbody>
                            ${data.education.map(edu => `
                                <tr>
                                    <td>${edu.exam}</td>
                                    <td>${edu.board}</td>
                                    <td class="center">${edu.year}</td>
                                    <td class="center">${edu.grade}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>` : ''}

                ${data.skills.length > 0 ? `
                <div class="section">
                    <div class="section-title">Technical Skills</div>
                    <div class="skills-grid">
                        ${data.skills.map(s => `<span class="skill-badge">${s}</span>`).join('')}
                    </div>
                </div>` : ''}

                <div class="section">
                    <div class="section-title">Personal Details</div>
                    <table class="profile-table">
                        ${data.personal.details.map(d => `
                            <tr>
                                <td class="profile-label">${d.label}</td>
                                <td>${d.val}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">Declaration</div>
                    <p>${data.declaration}</p>
                </div>

                <div class="footer">
                    <div>
                        Place: ${data.meta.place}<br>
                        Date: ${data.meta.date}
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        (${data.personal.name})
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(pdfContainer);

        // Generate PDF
        const opt = {
            margin: 0,
            filename: `${data.personal.name.replace(/\s+/g, '_')}_Resume.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(pdfContainer).save().then(() => {
            // Cleanup and Restore Button
            document.body.removeChild(pdfContainer);
            generateBtn.innerHTML = originalBtnText;
            generateBtn.disabled = false;
        }).catch(err => {
            console.error(err);
            alert('Error generating PDF. Please try again.');
            generateBtn.innerHTML = originalBtnText;
            generateBtn.disabled = false;
            if (document.body.contains(pdfContainer)) {
                document.body.removeChild(pdfContainer);
            }
        });
    });
});
