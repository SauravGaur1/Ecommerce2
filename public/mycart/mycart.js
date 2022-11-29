let addButtons = document.querySelectorAll(".addButton");
let minusButtons = document.querySelectorAll(".minusButton");
let payButton = document.getElementById("rzr-pay-1");
console.log(payButton);

setEvents(addButtons);
setEvents(minusButtons);

function setEvents(list) {
    list.forEach((item) => {
        item.addEventListener('click', function (event) {
            // console.log(event.target.id);
            if (event.target.getAttribute("class") == "minusButton") {
                getData('-', event.target.id);
            } else {
                getData('+', event.target.id);
            }
        });
    });
}

function getData(operation, id) {
    let obj = {
        id: id
    };
    let request = new XMLHttpRequest();
    request.open('POST', '/getProduct');
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(obj));
    // console.log(obj);
    request.addEventListener('load', function () {
        if (request.status == 200) {
            obj = JSON.parse(request.responseText);
            console.log(obj);
            manageQuantity(operation, obj);
        }
    });
}

function manageQuantity(operation, objModal) {
    let request = new XMLHttpRequest();
    request.open('POST', '/addToCart');
    request.setRequestHeader('Content-Type', 'application/json');
    let need = { operation: operation, obj: objModal };
    request.send(JSON.stringify(need));
    // console.log(objModal);
    request.addEventListener('load', function () {
        if (request.status == 200) {
            let obj = JSON.parse(request.responseText);
            // consol.log(obj);
            document.getElementById("quanty" + objModal.productimg).innerText = obj.quantity;
            document.getElementById("totalp" + objModal.productimg).innerText = "₹" + obj.quantity * objModal.productprice;

            if (obj.quantity == 0) {
                let parent = document.getElementById("parent" + objModal.productimg);
                parent.remove(parent);
                window.location.reload();
            }
        }
    });
}

payButton.addEventListener('click', function () {
    let obj = {
        amount: 495000
    }
    let request = new XMLHttpRequest();
    request.open('post', '/pay');
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', function () {
        let order = JSON.parse(request.responseText);
        console.log(order.amount);
        var options = {
            "key": "rzp_test_SRZ05Qk4jGTGRh", // Enter the Key ID generated from the Dashboard
            "amount": "50000", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "name": "LOGO",
            "description": "This account has 0 limit :(",
            "image": "https://example.com/your_logo",
            "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            "callback_url": "/orderSuccess",
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        var rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            alert(response.error.code);
            alert(response.error.description);
        });
        
            rzp1.open();
    });
    request.send(JSON.stringify(obj));

});
