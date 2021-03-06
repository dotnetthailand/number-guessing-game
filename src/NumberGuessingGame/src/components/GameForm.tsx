import React, { ChangeEvent, MouseEvent, useEffect, useState } from 'react';
import axios from 'axios';
import '../scss/style.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook } from '@fortawesome/free-brands-svg-icons'
import { Button } from 'react-bootstrap';
import FacebookService, { IFb } from '../FacebookService';
import { useSelector, RootStateOrAny, useDispatch } from 'react-redux';

declare let FB: IFb;//reference existing variable from Facebook SDK

type Props = {
  gameId: number;
};

const facebookService = new FacebookService();

// https://stackoverflow.com/a/63350992/1872200
export default function GameForm({ gameId }: Props) {
  const count = useSelector((state: RootStateOrAny) => state.CounterReducer.count);
  console.log(count);
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [isLogIn, setIsLogIn] = useState(false);
  const [userId, setUserId] = useState(0);
  const [guessedNumber, setGuessedNumber] = useState('');
  const [isDisabledButton, setIsDisabledButton] = useState(false);

  useEffect(() => {

    const getLogInStatus = async () => {
      while (typeof FB === 'undefined') {
        await delay(250);
        console.log('next delay');
      }

      try {
        const logInResponse = await facebookService.getLogInStatus();
        const connectResponse = await connectUser(logInResponse.accessToken, logInResponse.userID);
        setUserId(connectResponse.data.id);
        setIsLogIn(true);
      } catch (ex) {
        // A user hasn't logged in, no need to handle.
        console.warn(ex);
      }
      setIsLoading(false)
    };

    getLogInStatus();

    // // Delay for FB SDK to be ready
    // setTimeout(() => getLogInStatus(), 2000);

  }, []);

  const handleOnClick = async (event: MouseEvent<HTMLButtonElement>) => {
    try {
      event.preventDefault();

      const logInResponse = await facebookService.logIn();
      const connectResponse = await connectUser(logInResponse.accessToken, logInResponse.userID);

      setUserId(connectResponse.data.id);
      setIsLogIn(true);

    } catch (ex) {
      await facebookService.handleException(ex);
    }
  };

  const handleGuessedNumberSubmit = async (event: MouseEvent<HTMLButtonElement>) => {
    setIsDisabledButton(true);
    try {
      event.preventDefault();
      await play(userId, gameId, guessedNumber);
      alert("Thanks for playing the game with us");
      location.href = '/'; // Reload the page
    } catch (error: any) {
      alert(error.response.data.errorMessage);
    }
    setIsDisabledButton(false);
  };

  const handleGuessedNumberChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    setGuessedNumber(event.currentTarget.value);
  }

  // https://fontawesome.com/v5.15/how-to-use/on-the-web/using-with/react
  return (
    <div className="main-container d-flex justify-content-center align-items-center">

      <h1>count {count} </h1>
      <div>
        <button onClick={() => dispatch({ type: 'increase', payload: 1 })}>add one</button>
      </div>
      {isLoading
        ? <div className="loading-text">Loading the game...</div>
        :
        <div>
          {
            isLogIn
              ?
              <div className="game-form d-flex flex-column justify-content-center">
                <span className="header-game">Number Guessing Game</span>
                <input type="text"
                  className="form-control input-guessedNumber rounded-pill"
                  name="GuessedNumber"
                  placeholder='Enter your guessed number'
                  onChange={handleGuessedNumberChanged}
                  maxLength={2} />
                <button
                  className="btn rounded-pill btn-guess"
                  type="button"
                  onClick={handleGuessedNumberSubmit}
                  disabled={isDisabledButton}>Guess 2 digits number</button>
              </div>
              :
              <div>
                <Button onClick={handleOnClick} className="d-flex flex-row align-items-center -gap-sm">
                  <FontAwesomeIcon icon={faFacebook} size='2x' color='#fff' />
                  Please log in with Facebook to play the game.
                </Button>
              </div>
          }
        </div>
      }
    </div>
  );
}

async function connectUser(facebookAccessToken: string, facebookAppScopedUserId: number) {
  const client = axios.create();
  const params = new URLSearchParams();
  params.append('facebookAccessToken', facebookAccessToken);
  params.append('facebookAppScopedUserId', facebookAppScopedUserId.toString());
  const url = '/game/connect'; // URL is from custom route
  return await client.post<User>(url, params);
}

type User = {
  id: number;
};

async function play(userId: number, gameId: number, guessNumber: string) {
  const client = axios.create();
  const params = new URLSearchParams();
  params.append('UserId', userId.toString());
  params.append('GameId', gameId.toString());
  params.append('GuessedNumber', guessNumber);
  const url = '/game/play';
  await client.post(url, params);
}

function delay(millisecond) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecond);
  });
}