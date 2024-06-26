import React, {
  useEffect,
  useState,
  useContext,
} from 'react';
import {
  Link,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import ProtectedRoute from './ProtectedRoutes';
import axios from 'axios';
import { io } from 'socket.io-client';
const socket = io();
import FeedPage from './FeedPage';
import HomePage from './HomePage';
import MapPage from './MapPage';
import UserPage from './UserPage';
import Login from './Login';
import EventPage from './EventPage';
import NavBar from './NavBar';
import Loading from './Loading';
import Parades from './Parades';
import TopNavBar from './TopNavBar';

import CreateContentModal from './CreateContentModal/CreateContentModal';
import ConfirmActionModal from './ConfirmActionModal';
import ShareModal from './ShareModal';

import { ThemeContext, RunModeContext, UserContext, ContentFunctionsContext } from './Context';
import { Post } from '../types';

const App = () => {
  const { user, isLoading, isAuthenticated } = useAuth0();

  // CONFIRM ACTION MODAL STATE
  const [confirmActionFunction, setConfirmActionFunction] = useState(null);
  const [showConfirmActionModal, setShowConfirmActionModal] =
    useState<boolean>(false);
  const [confirmActionText, setConfirmActionText] = useState<null | string>(
    null
  );
  // Object that bundles confirm action functionality. Pass this to each page, so we don't need to have a unique modal sitting on each page.
  const setConfirmActionModalBundle = {
    setConfirmActionFunction,
    setShowConfirmActionModal,
    setConfirmActionText,
  };

  // SHARE MODAL STATE
  const [postToShare, setPostToShare] = useState<Post|null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const setShareModalBundle = {
    postToShare,
    setPostToShare,
    showShareModal,
    setShowShareModal,
  };

  // CREATECONTENT MODAL STATE
  const [showCreateContentModal, setShowCreateContentModal] =
    useState<boolean>(false);
  const [parentPost, setParentPost] = useState<null | Post>(null);
  const [postToEdit, setPostToEdit] = useState<null | Post>(null);
  const [createContentModalKey, setCreateContentModalKey] = useState<'comment' | 'pin' | 'plan' | 'friend' | 'photo'>('photo')
  const setCreateContentModalBundle = {
    createContentModalKey,
    setCreateContentModalKey,
    showCreateContentModal,
    setShowCreateContentModal,
    setParentPost,
    setPostToEdit,
  };

  // Context that sends functions that set state for modals that live in App.tsx
  const contentFunctions = {
    setConfirmActionModalBundle,
    setCreateContentModalBundle,
    setShareModalBundle,
  }

  // WHAT DOES userData DO?
  const [userId, setUserId] = useState(null);
  const [currWeather, setCurrWeather] = useState('');
  const [currTemp, setCurrTemp] = useState('');
  const [theme, setTheme] = useState('pg-theme-light');

  const [userContextInfo, setUserContextInfo] = useState({
    user: {},
    votes: [],
    friends: [],
    plans: [],
  });

  const isDemoMode = useContext(RunModeContext) === 'demo';

  // start with NOLA coordinates
  const [lng, setLng] = useState(-90.0715);
  const [lat, setLat] = useState(29.9511);

  // this gets user from database
  // sets user state. This function runs
  // when user is set from Auth0, which happens
  // on Auth0 login
  const getUser = async () => {
    try {
      // Dummy: always fetch for Bob J. Would normally grab user from Auth state using the same kv's for request to server


      const user = {
        email: 'a@b.com',
        given_name: 'Bob',
        family_name: 'Johnson',
      };

      // this request gets user's info, votes and friends
      const userResponse: any = await axios.post(`api/home/user/`, { user });

      // set id state after fetching data from users DB
      setUserId(userResponse.data.userData[0].id);

      // set user context info
      setUserContextInfo({
        user: userResponse.data.userData[0],
        votes: userResponse.data.userVotes,
        friends: userResponse.data.userFriends,
        plans: userResponse.data.userPlans,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // this sends coordinates to socket
  const showPosition = (position: any) => {
    setLng(position.coords.longitude);
    setLat(position.coords.latitude);

    socket.emit('userLoc', {
      longitude: position.coords.longitude,
      latitude: position.coords.latitude,
      id: userId,
    });
  };

  // updates userLoc in db after
  // lng is updated
  useEffect(() => {
    axios
      .patch('/userLoc', {
        longitude: lng,
        latitude: lat,
        id: userId,
      })
      .then()
      .catch((err) => console.error(err));
  }, [lng]);

  // gets coordinates from the browser
  // calls showPosition, which updates
  // lng, which causes lng and lat to get saved to db
  // thru above useEffect
  const getLocation = () => {
    if (navigator.geolocation) {
      return navigator.geolocation.getCurrentPosition(
        showPosition,
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      return null;
    }
  };

  // The two useEffects below both run on the first load,
  // but have conditions to check if the next operation
  // should execute.
  // 1st: auth0 sends user object in, isAuthenticated switches
  // 2nd: provided a user object, useEffect gets the
  // logged in user's info from the database, setting userId
  // 3rd: provided a non-null userId, the user's location
  // is looked up and emitted to socket.io server
  // TODO: sometimes the login runs twice and it may be because is authenticated changes. So getUser runs on first render, then again after it's actually authenticated
  useEffect(() => {
    user && getUser();
    if (isDemoMode) {
      //setUserId(1);
      getUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (userId !== null) {
      getLocation();
    }
  }, [userId]);

  const getWeather = async () => {
    try {
      const { data } = await axios.get(`/api/weather/${lat},${lng}`);
      setCurrWeather(data.current.condition.icon);
      setCurrTemp(data.current.temp_f);
    } catch (err) {
      console.error(err);
    }
  };

  // makes sure weather doesn't keep refreshing whenever lat changes
  let weatherRefreshCount = 0;
  useEffect(() => {
    if (weatherRefreshCount < 2 && lat !== 0) {
      getWeather();
      weatherRefreshCount += 1;
    }
  }, [lat]);

  if (isLoading || (isLoading && lng === 0 && user)) {
    return <Loading />;
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path='/' element={<Login />} />
        <Route element={isDemoMode ? null : <ProtectedRoute />}>
          <Route
            path='/homepage'
            element={
              <div>
                <TopNavBar
                  title={
                    user
                      ? `Welcome, ${user.given_name}!`
                      : 'Welcome to Pardi Gras!'
                  }
                  currWeather={currWeather}
                  currTemp={currTemp}
                />
                <HomePage
                  userId={userId}
                  lat={lat}
                  lng={lng}
                />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
          <Route
            path='/mappage'
            element={
              <div>
                <Link to='/homepage'>
                  <TopNavBar
                    title={'Map'}
                    currWeather={currWeather}
                    currTemp={currTemp}
                  />
                </Link>
                <MapPage
                  userLat={lat}
                  userLng={lng}
                  userId={userId}
                  getLocation={getLocation}
                />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
          <Route
            path='/feedpage'
            element={
              <div>
                <Link to='/homepage'>
                  <TopNavBar
                    title={user ? `${user.given_name}'s Feed` : 'Feed'}
                    currWeather={currWeather}
                    currTemp={currTemp}
                  />
                </Link>
                <FeedPage
                  userId={userId}
                />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
          <Route
            path='/parades'
            element={
              <div>
                <Link to='/homepage'>
                  <TopNavBar
                    title={'Parades'}
                    currWeather={currWeather}
                    currTemp={currTemp}
                  />
                </Link>
                <Parades userId={userId} lng={lng} lat={lat} />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
          <Route
            path='/eventpage'
            element={
              <div>
                <Link to='/homepage'>
                  <TopNavBar
                    title={'Live Music'}
                    currWeather={currWeather}
                    currTemp={currTemp}
                  />
                </Link>
                <EventPage userId={userId} lng={lng} lat={lat} />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
          <Route
            path='/userpage'
            element={
              <div>
                <Link to='/homepage'>
                  <TopNavBar
                    title='Krewe & Calendar'
                    currWeather={currWeather}
                    currTemp={currTemp}
                  />
                </Link>
                <UserPage
                  userId={userId}
                  lng={lng}
                  lat={lat}
                  setTheme={setTheme}
                  setConfirmActionBundle={setConfirmActionModalBundle}
                />{' '}
                <NavBar setShowCreateContentModal={setShowCreateContentModal} />
              </div>
            }
          />
        </Route>
      </Route>
    )
  );

  console.log('APP, user: ', userContextInfo)
  return (
    <ContentFunctionsContext.Provider value={contentFunctions}>
      <UserContext.Provider value={userContextInfo}>
        <RunModeContext.Provider value={process.env.RUN_MODE}>
          <ThemeContext.Provider value={theme}>
            <RouterProvider router={router} />
            <ConfirmActionModal
              showConfirmActionModal={showConfirmActionModal}
              setShowConfirmActionModal={setShowConfirmActionModal}
              confirmActionFunction={confirmActionFunction}
              setConfirmActionFunction={setConfirmActionFunction}
              confirmActionText={confirmActionText}
              setConfirmActionText={setConfirmActionText}
            />
            <ShareModal
            />
            <CreateContentModal
              parentPost={parentPost} // defaults to null
              postToEdit={postToEdit} // default to null
              lat={lat}
              lng={lng}
            />
          </ThemeContext.Provider>
        </RunModeContext.Provider>
      </UserContext.Provider>
    </ContentFunctionsContext.Provider>
  );
};

export default App;
