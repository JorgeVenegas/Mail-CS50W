document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");

  // Submit email form
  document
    .querySelector("#compose-form")
    .addEventListener("submit", (event) => send_email(event));
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_email() {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  let replyButton = document.createElement('button')
  replyButton.classList.add('btn', 'btn-sm', 'btn-outline-primary')
  replyButton.setAttribute('id', 'reply')
  document.querySelector('#replyButton').appendChild(replyButton);
  
  let archiveButton = document.createElement('button')
  archiveButton.classList.add('btn', 'btn-sm', 'btn-outline-primary')
  archiveButton.setAttribute('id', 'archieve')
  document.querySelector('#archiveButton').appendChild(archiveButton);

  fetch(`/emails/${this.id}`).then(
    response => response.json()
  ).then(
    emailInfo => {
      if (!emailInfo.read) {
        fetch(`/emails/${this.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      }

      document.querySelector("#sender").innerHTML = emailInfo.sender;
      document.querySelector("#recipients").innerHTML = emailInfo.recipients;
      document.querySelector("#subject").innerHTML = emailInfo.subject;
      document.querySelector("#timestamp").innerHTML = emailInfo.timestamp;
      document.querySelector("#mail-body").innerHTML = emailInfo.body;

      let archieveBtn = document.querySelector("#archieve");
      archieveBtn.innerHTML = emailInfo.archived ? "Unarchive" : "Archive";

      let id = this.id;

      function handle_archieve() {

      }

      if (!archieveBtn.classList.contains('archieve-handler')) {
        archieveBtn.classList.add('archieve-handler')
        archieveBtn.addEventListener('click', () => {
          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !emailInfo.archived
            })
          }).then(() => {
            let status = !emailInfo.archived ? "archived" : "unarchived";
            load_mailbox("inbox")(`Email ${status} succesfully.`)
          })
        })
      }

    }
  )
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";


  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {

      for (let email of emails) {

        // Create email card for each email.
        let card = document.createElement("div");
        card.classList.add("col-12");
        card.classList.add("card");
        card.classList.add("border-light");
        card.classList.add("mb-3");
        card.setAttribute('tabindex', '0');
        card.setAttribute('id', `${email.id}`);

        if (email.read) {
          card.classList.add('text-bg-light')
        }

        let cardBody = document.createElement("div");
        cardBody.classList.add("card-body");
        cardBody.classList.add("row");
        cardBody.classList.add("mx-0");

        let emailSenderCol = document.createElement("div");
        emailSenderCol.classList.add("col-4");

        let emailSender = document.createElement("strong");
        emailSender.classList.add("text-truncate");
        emailSender.innerHTML = email.sender;

        emailSenderCol.appendChild(emailSender);

        let emailSubjectCol = document.createElement("div");
        emailSubjectCol.classList.add("col-4");

        let emailSubject = document.createElement("span");
        emailSubject.classList.add("text-truncate");
        emailSubject.innerHTML = email.subject;

        emailSubjectCol.appendChild(emailSubject);

        let emailDateCol = document.createElement("div");
        emailDateCol.classList.add("col-4");
        emailDateCol.classList.add("d-flex");
        emailDateCol.classList.add("justify-content-end");

        let emailDate = document.createElement("span");
        emailDate.classList.add("text-truncate");
        emailDate.innerHTML = email.timestamp;

        emailDateCol.appendChild(emailDate);

        cardBody.appendChild(emailSenderCol)
        cardBody.appendChild(emailSubjectCol)
        cardBody.appendChild(emailDateCol)

        card.appendChild(cardBody);

        card.addEventListener('click', load_email)

        document.querySelector("#emails-view").appendChild(card);
      }
    });

  // Curried function to send message on mailbox loading
  return function load_message(message) {
    let alert = document.createElement("div");
    alert.className = "alert";
    alert.classList.add("alert-primary");
    alert.classList.add("alert-dismissible");
    alert.setAttribute("role", "alert");

    let closeButton = document.createElement("span");
    closeButton.type = "button";
    closeButton.className = "btn-close";
    closeButton.setAttribute("data-bs-dismiss", "alert");
    closeButton.setAttribute("aria-label", "Close");

    let messageDiv = document.createElement("div");
    messageDiv.innerHTML = message;

    alert.appendChild(messageDiv);
    alert.appendChild(closeButton);

    document.querySelector("#emails-view").appendChild(alert);
  };
}

function send_email(event) {
  // Get email information and store it on variables

  event.preventDefault();
  let recipients = document.querySelector("#compose-recipients").value;
  let subject = document.querySelector("#compose-subject").value;
  let body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      let alert = document.querySelector("#email-sent-alert");
      alert.style.display = "block";
      alert.className = "alert";
      if (result.error) {
        alert.classList.add("alert-danger");
        alert.innerHTML = result.error;
      } else {
        load_mailbox("sent")(result.message);
      }
    });
}
