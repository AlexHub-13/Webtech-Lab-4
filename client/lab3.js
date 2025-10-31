const base = 'http://localhost:3000/api/courses';

// Run once page loads
document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();

  document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createCourse();
  });

  document.getElementById('member-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createMember();
  });

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createSignup();
  });

  document.getElementById('add-slot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createSlot();
  });

  document.getElementById('modify-slot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await modifySlot();
  });

  document.getElementById('member-slot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createSlotMember();
  });

  document.getElementById('grade-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await modifyGrade();
  });
});

// Fetch and display all courses
async function loadDatabase() {
  try {
    const resCourses = await fetch(base);
    const courses = await resCourses.json();

    const list = document.getElementById('course-list');
    list.innerHTML = '';

    if (courses.length === 0) {
      list.innerHTML = '<li>No courses yet.</li>';
      return;
    }

    // Load courses:
    for (const course of courses){
      const li = document.createElement('li');
      li.textContent = `${course.term} - ${course.name} (Section ${course.section})`;

      let delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteCourse(course.term, course.section));
      li.appendChild(delBtn);

      // Load members:
      const resMembers = await fetch(`${base}/${course.term}/${course.section}/members`);
      const members = await resMembers.json();

      li.appendChild(document.createElement('br'));
      const mHeader = document.createTextNode('Members:');
      li.appendChild(mHeader);

      const mList = document.createElement('ul');

      // Display members:
      for (const member of members) {
        const memberLi = document.createElement('li');
        memberLi.textContent = `${member.role} - ${member.fName} ${member.lName} (ID: ${member.id})`;
        mList.appendChild(memberLi);

        let delBtn2 = document.createElement('button');
        delBtn2.textContent = 'Delete';
        delBtn2.addEventListener('click', () => deleteMember(course.term, course.section, member.id));
        memberLi.appendChild(delBtn2);
      }

      li.appendChild(mList);

      // Load signups:
      const resSignups = await fetch(`${base}/${course.term}/${course.section}/signups`);
      const signups = await resSignups.json();

      const sHeader = document.createTextNode('Signup sheets:');
      li.appendChild(sHeader);

      const sList = document.createElement('ul');

      // Display signups:
      for (const signup of signups) {
        const sLi = document.createElement('li');
        sLi.textContent = `${signup.name} - ${signup.notBefore} to ${signup.notAfter} (ID: ${signup.id})`;
        sList.appendChild(sLi);

        let delBtn3 = document.createElement('button');
        delBtn3.textContent = 'Delete';
        delBtn3.addEventListener('click', () => deleteSignup(course.term, course.section, signup.id));
        sLi.appendChild(delBtn3);

        // Load slots:
        const resSlots = await fetch(`${base}/${course.term}/${course.section}/signups/${signup.id}/slots`);
        const slots = await resSlots.json();

        sLi.appendChild(document.createElement('br'));
        const slHeader = document.createTextNode('Slots:');
        sLi.appendChild(slHeader);

        const slList = document.createElement('ul');

        // Display slots:
        for (const slot of slots) {
          const slLi = document.createElement('li');
          slLi.textContent = `${slot.id} - Starts ${slot.start} for a duration of ${slot.duration}. (Num: ${slot.numSlots}, Max. members: ${slot.maxMembers})`;
          slList.appendChild(slLi);

          let delBtn4 = document.createElement('button');
          delBtn4.textContent = 'Delete';
          delBtn4.addEventListener('click', () => deleteSlot(course.term, course.section, signup.id, slot.id));
          slLi.appendChild(delBtn4);

          // Load slot members:
          const resSlMembers = await fetch(`${base}/${course.term}/${course.section}/signups/${signup.id}/slots/${slot.id}/members`);
          const slMembers = await resSlMembers.json();

          slLi.appendChild(document.createElement('br'));
          const slmHeader = document.createTextNode('Members:');
          slLi.appendChild(slmHeader);

          const slmList = document.createElement('ul');

          // Display slot members:
          for (const slm of slMembers) {
            const slmLi = document.createElement('li');
            slmLi.textContent = `${slm.id} - Grade: ${slm.grade}, Comment: ${slm.comment}`;
            slmList.appendChild(slmLi);

            let delBtn5 = document.createElement('button');
            delBtn5.textContent = 'Delete';
            delBtn5.addEventListener('click', () => deleteSlotMember(course.term, course.section, signup.id, slot.id, slm.id));
            slmLi.appendChild(delBtn5);
          }

          slLi.appendChild(slmList);
        }

        sLi.appendChild(slList);
      }

      li.appendChild(sList);

      list.appendChild(li);
      list.appendChild(document.createElement('br'));
    }
  } catch (err) {
    console.error('Error while loading courses:', err);
  }
}

// Create and delete courses:
async function createCourse() {
  const term = document.getElementById('cTerm').value;
  const name = document.getElementById('cName').value.trim();
  const section = document.getElementById('cSection').value || 1;

  const body = { term: String(term), name, section: String(section) };

  try {
    const res = await fetch(base, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Course created.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to create course.'));
    }
  } catch (err) {
    console.error('Error creating course:', err);
  }
}

async function deleteCourse(term, section) {
  if (!confirm(`Delete course ${term} (section ${section})?`)) return;

  try {
    const res = await fetch(`${base}/${term}/${section}`, { method: 'DELETE' });

    if (res.ok) {
      alert('Course deleted.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to delete course.'));
    }
  } catch (err) {
    console.error('Error deleting course:', err);
  }
}

// Create and delete members:
async function createMember() {
  const term = document.getElementById('mTerm').value;
  const section = document.getElementById('mSection').value || 1;

  const id = document.getElementById('mID').value;
  const fName = document.getElementById('mFName').value;
  const lName = document.getElementById('mLName').value;
  const role = document.getElementById('mRole').value;

  const body = { "members": [ { id, fName, lName, role } ]};

  try {
    const res = await fetch(`${base}/${term}/${section}/members`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Member created.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to create member.'));
    }
  } catch (err) {
    console.error('Error creating member:', err);
  }
}

async function deleteMember(term, section, id) {
  if (!confirm(`Delete member ID ${id} from course ${term} (section ${section})?`)) return;

  try {
    const body = { ids: [id] };
    const res = await fetch(`${base}/${term}/${section}/members`, { 
      method: 'DELETE',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body) 
    });

    if (res.ok) {
      alert('Member deleted.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to delete member.'));
    }
  } catch (err) {
    console.error('Error deleting member:', err);
  }
}

// Create and delete signups:
async function createSignup() {
  const term = document.getElementById('sTerm').value;
  const section = document.getElementById('sSection').value || 1;

  const id = document.getElementById('sID').value;
  const name = document.getElementById('sName').value;
  const start = document.getElementById('sStart').value;
  const end = document.getElementById('sEnd').value;

  const body = { id, name, notBefore: start, notAfter: end };

  try {
    const res = await fetch(`${base}/${term}/${section}/signups`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Signup created.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to create signup.'));
    }
  } catch (err) {
    console.error('Error creating signup:', err);
  }
}

async function deleteSignup(term, section, id) {
  if (!confirm(`Delete signup ID ${id} from course ${term} (section ${section})?`)) return;

  try {
    const body = { id };
    const res = await fetch(`${base}/${term}/${section}/signups`, { 
      method: 'DELETE',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body) 
    });

    if (res.ok) {
      alert('Signup deleted.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to delete signup.'));
    }
  } catch (err) {
    console.error('Error deleting signup:', err);
  }
}

// Create, delete, and modify slot:
async function createSlot() {
  const term = document.getElementById('slTerm').value;
  const section = document.getElementById('slSection').value || 1;
  const sheetID = document.getElementById('slSignupID').value;

  const id = document.getElementById('slID').value;
  const start = document.getElementById('slStart').value;
  const duration = document.getElementById('slDuration').value;
  const num = document.getElementById('slNum').value;
  const max = document.getElementById('slMax').value;

  const body = { id, start, duration, numSlots: num, maxMembers: max };

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Slot created.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to create slot.'));
    }
  } catch (err) {
    console.error('Error creating slot:', err);
  }
}

async function deleteSlot(term, section, sheetID, slotID) {
  if (!confirm(`Delete slot ID ${slotID} from course ${term} (section ${section}) and signup sheet ID ${sheetID}?`)) return;

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}`, { 
      method: 'DELETE'
    });

    if (res.ok) {
      alert('Slot deleted.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to delete slot.'));
    }
  } catch (err) {
    console.error('Error deleting slot:', err);
  }
}

async function modifySlot() {
  const term = document.getElementById('mslTerm').value;
  const section = document.getElementById('mslSection').value || 1;
  const sheetID = document.getElementById('mslSignupID').value;
  const slotID = document.getElementById('mslID').value;

  const start = document.getElementById('mslStart').value;
  const duration = document.getElementById('mslDuration').value;
  const num = document.getElementById('mslNum').value;
  const max = document.getElementById('mslMax').value;

  const body = { start, duration, numSlots: num, maxMembers: max };

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Slot modified.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to modify slot.'));
    }
  } catch (err) {
    console.error('Error modifying slot:', err);
  }
}

// Create and delete slot member:
async function createSlotMember() {
  const term = document.getElementById('slmTerm').value;
  const section = document.getElementById('slmSection').value || 1;
  const sheetID = document.getElementById('slmSignupID').value;
  const slotID = document.getElementById('slmSlotID').value;

  const memberID = document.getElementById('slmID').value;

  const body = { id: memberID };

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}/members`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Member created.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to create member.'));
    }
  } catch (err) {
    console.error('Error creating member:', err);
  }
}

async function deleteSlotMember(term, section, sheetID, slotID, memberID) {
  if (!confirm(`Delete member ID ${memberID} from course ${term} (section ${section}), signup ID ${sheetID}, and slot ID ${slotID}?`)) return;

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}/members/${memberID}`, { method: 'DELETE' });

    if (res.ok) {
      alert('Member deleted.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to delete member.'));
    }
  } catch (err) {
    console.error('Error deleting member:', err);
  }
}

// Modify grade (PUT slot member)
async function modifyGrade() {
  const term = document.getElementById('gTerm').value;
  const section = document.getElementById('gSection').value || 1;
  const sheetID = document.getElementById('gSignupID').value;
  const slotID = document.getElementById('gSlotID').value;
  const memberID = document.getElementById('gID').value;

  const grade = document.getElementById('gGrade').value;
  const comment = document.getElementById('gComment').value;

  const body = { grade, comment };

  try {
    const res = await fetch(`${base}/${term}/${section}/signups/${sheetID}/slots/${slotID}/members/${memberID}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Grade modified.');
      loadDatabase();
    } else {
      alert('Error: ' + (res.status || 'Failed to modify grade.'));
    }
  } catch (err) {
    console.error('Error modifying grade:', err);
  }
}