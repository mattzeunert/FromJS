export default function makeGetErrorFunction(){
    var err = null;
    return function(){
        if (err === null){
            err = Error();
        }
        return err;
    }
}
