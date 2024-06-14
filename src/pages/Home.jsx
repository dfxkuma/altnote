import { useEffect } from 'react';
import { useUserStore } from "../store";
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Note from '../pages/Note';
import Welcome from '../pages/Welcome';

export const Home = () => {
    const { user, setUser } = useUserStore((state) => state);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
    }, []);

    return (
        <div className={ 'container' }>
            { user ? <Note /> : <Welcome /> }
        </div>
    );

}