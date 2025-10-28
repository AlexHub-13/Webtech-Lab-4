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

      li.innerHTML += '<br>';
      const mHeader = document.createTextNode('Members:');
      li.appendChild(mHeader);

      const mList = document.createElement('ul');

      // Display members:
      for (const member of members) {
        const memberLi = document.createElement('li');
        memberLi.textContent = `${member.role} - ${member.fName} ${member.lName} (ID: ${member.id})`;
        mList.appendChild(memberLi);

        let delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteMember(course.term, course.section, member.id));
        memberLi.appendChild(delBtn);
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

        let delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => deleteSignup(course.term, course.section, signup.id));
        sLi.appendChild(delBtn);

        // Load slots:
        const resSlots = await fetch(`${base}/${course.term}/${course.section}/signups/${signup.id}/slots`);
        const slots = await resSlots.json();

        sLi.innerHTML += '<br>';
        const slHeader = document.createTextNode('Slots:');
        sLi.appendChild(slHeader);

        const slList = document.createElement('ul');

        // Display slots:
        for (const slot of slots) {
          const slLi = document.createElement('li');
          slLi.textContent = `${slot.id} - Starts ${slot.start} for a duration of ${slot.duration}. (Num: ${slot.numSlots}, Max. members: ${slot.maxMembers})`;
          slList.appendChild(slLi);

          /*
          let delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.addEventListener('click', () => deleteSlot(course.term, course.section, signup.id));
          slLi.appendChild(delBtn);
          */

          // Load slot members:
          const resSlMembers = await fetch(`${base}/${course.term}/${course.section}/signups/${signup.id}/slots/${slot.id}/members`);
          const slMembers = await resSlMembers.json();

          slLi.innerHTML += '<br>';
          const slmHeader = document.createTextNode('Members:');
          slLi.appendChild(slmHeader);

          const slmList = document.createElement('ul');

          // Display slot members:
          for (const slm of slMembers) {
            const slmLi = document.createElement('li');
            slmLi.textContent = `${slm.id} - Grade: ${slm.grade}, Comment: ${slm.comment}`;
            slmList.appendChild(slmLi);

            /*
            let delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => deleteSignup(course.term, course.section, signup.id));
            slmLi.appendChild(delBtn);
            */
          }

          slLi.appendChild(slmList);
        }

        sLi.appendChild(slList);
      }

      li.appendChild(sList);

      list.appendChild(li);
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