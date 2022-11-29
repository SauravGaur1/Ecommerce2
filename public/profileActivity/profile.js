let imagePicker = document.getElementById("imagePicker");
let profileImage = document.getElementById("profileImage")
let imgChoosen = 0;

profileImage.addEventListener('click',function(){
    imagePicker.click();
});
imagePicker.addEventListener('change',()=>{
    let reader = new FileReader();
    let imgDetails = document.querySelector("input[type=file]").files[0];
    if(imgDetails){
        imgChoosen = 1;
        reader.readAsDataURL(imgDetails);
        reader.addEventListener('load',function(){
            console.log("in");
            profileImage.setAttribute("src",reader.result);
        });
    }
});

