let dialog = document.getElementById("dialogBox");
let closeButton = document.getElementById("closeDialog");
let productname = document.getElementById("productname");
let productdesp = document.getElementById("productdesp");
let productprice = document.getElementById("productprice");
let productimg = document.getElementById("productimg");
let productStock = document.getElementById('productStock');
let gotoProfile = document.getElementById("gotoProfile");
let addToCart = document.getElementById("addToCartButton");
let loadMoreBtn = document.getElementById('loadMoreBtn');
let mainRow = document.getElementById("row");
let tempObj;

closeButton.addEventListener('click',function(){

        dialog.style.display = "none";
        // dialog.close();
});


addToCart.addEventListener('click',function(event){
    let need = {operation: null,obj:tempObj};
    addThisItem(need);
});



loadMoreBtn.addEventListener('click',function(){
    let request = new XMLHttpRequest();
    request.open('GET','/loadmore');
    request.addEventListener('load',function(){
        console.log(request.responseText);
        if(request.responseText != '0'){
            let list = JSON.parse(request.responseText);
            loadMoreData(list);
        }else{
            loadMoreBtn.innerText = "Thats All!:)"
            loadMoreBtn.setAttribute("class","btn btn-dark");
        }
       
    });
    request.send();
})
//functions

function getProduct(id){
    console.log(id);
    getData(id);
    dialog.style.display = "flex";
    addToCart.innerText = "Add To Cart"
    addToCart.setAttribute("class","btn btn-outline-dark");
}

function getData(id){
    let obj = {
        id:id
    };
    let request = new XMLHttpRequest();
    request.open('POST','/getDetails');
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify({id:id}));
    console.log(obj);
    request.addEventListener('load',function(){
        if(request.status == 200){
            obj = JSON.parse(request.responseText);
            tempObj = obj;
            productname.innerText = obj.productname;
            productdesp.innerText = obj.productdescription;
            productprice.innerText = "₹" + obj.productprice;
            productStock.innerText = "In stock : " + obj.stock + " left";
            productimg.setAttribute("src",obj.productimg);
        }
    });
}

function loadMoreData(list){
    list.forEach(item => {
        let mainCol = document.createElement('div');
        mainCol.setAttribute("class","col col-md-6 col-lg-3 product");//main parent
        mainCol.setAttribute("style","margin-top: 1rem");
        let card = document.createElement('div');
        card.setAttribute("class","card");//second main parent
        let img = document.createElement('img');
        img.setAttribute("class","card-img-top");//
        img.setAttribute("style","height: 10rem; width: 10rem;");//
        img.setAttribute("src",item.productimg);
        let card_body = document.createElement('div');//3rd main parent
        card_body.setAttribute("class","card-body");//
        let card_title = document.createElement('h5');
        card_title.setAttribute("class","card-title");
        card_title.innerText =  (item.productname).substring(0,50) + "..." ;
        let desc = document.createElement('p');
        desc.setAttribute("class","card-text");
        desc.innerText = (item.productdescription).substring(0,50) + "..." ;
        let price = document.createElement('p');
        price.setAttribute("class","card-text text-muted");
        price.innerText =  "₹" + (item.productprice);
        let stock = document.createElement('p');
        stock.setAttribute("class","card-text text-muted");
        stock.innerText =  "In stock" + (item.stock) + " left";
        let descButton = document.createElement("button");
        descButton.setAttribute("class","viewDetails");
        descButton.setAttribute("id",item.productimg);
        descButton.setAttribute("onclick",`getProduct(this.id)`);
        descButton.innerText = "View Desc.";
        card_body.append(card_title,desc,price,stock,descButton);
        card.append(img,card_body);
        mainCol.append(card);
        mainRow.append(mainCol);
    });  
}



function addThisItem(objModal){
    let request = new XMLHttpRequest();
    request.open('POST','/addToCart');
    addToCart.innerText = "Adding..."
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify(objModal));
    request.addEventListener('load',function(){
        if(request.status == 200){
            console.log("Item added!");
            addToCart.setAttribute("class","btn btn-outline-success");
            console.log(request);
            if(request.responseText == 0){
                addToCart.innerText = "Added To Cart!"
            }else{
                addToCart.innerText = "Already Added!"
            }
        }
    });
}

