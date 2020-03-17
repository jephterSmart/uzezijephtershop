const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value
   const token = btn.parentNode.querySelector('[name=_csrf]').value;
   
    fetch('/admin/delete-product/'+productId, {
        method: "DELETE",
        headers:{
            'csrf-token':token
        }
    })
    .then(result =>{
        
        return result.json()
    })
    .then(data => {
        const blockElement = btn.closest('article');
        blockElement.parentNode.removeChild(blockElement)
        console.log(data.message);
    })
    .catch(err => {
        console.log(data.message , data.error);
    })
}