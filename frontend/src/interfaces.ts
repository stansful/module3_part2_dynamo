interface User {
  email: string;
  password: string;
}

interface Token {
  token: string;
}

interface Gallery {
  objects: [
    {
      _id: string;
      path: string;
      metadata: {};
    },
  ];
  page: number;
}

interface ErrorMessage {
  errorMessage: string;
}

interface Message {
  message: string;
}