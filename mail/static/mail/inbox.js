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
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      let listGroup = document.createElement("div");  
      listGroup.classList.add("list-group");
      listGroup.classList.add("list-group-flush");

      document.querySelector("#emails-view").appendChild(listGroup);

      for (let email of emails) {
        let row = document.createElement("div");

        let listGroupItem = document.createElement("div");
        listGroupItem.classList.add("list-group-item");
        listGroupItem.classList.add("list-group-item-action");

        let emailSenderCol = document.createElement("div");
        emailSenderCol.className = "col-4";
        emailSenderCol.classList.add("col-md-4");

        let emailSender = document.createElement("strong");
        emailSender.innerHTML = email.sender;

        emailSenderCol.appendChild(emailSender);

        let emailSubjectCol = document.createElement("div");
        emailSubjectCol.className = "col-5";
        emailSubjectCol.classList.add("col-md-5");

        let emailSubject = document.createElement("span");
        emailSubject.innerHTML = email.subject;

        emailSubjectCol.appendChild(emailSubject);

        let emailDateCol = document.createElement("div");
        emailDateCol.className = "col-3";
        emailDateCol.classList.add("col-md-3");

        let emailDate = document.createElement("span");
        emailDate.innerHTML = email.timestamp;

        emailDateCol.appendChild(emailDate);

        listGroupItem.appendChild(emailSenderCol);
        listGroupItem.appendChild(emailSubjectCol);
        listGroupItem.appendChild(emailDateCol);

        listGroup.appendChild(listGroupItem);
      }
    });

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
