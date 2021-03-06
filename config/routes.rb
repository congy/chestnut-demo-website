Rails.application.routes.draw do
  get 'evaluate/show'

  get 'datalayout/show'

  get 'layout/show'

  get 'webpage/show'

  get 'customapp/show'

  get 'app/index'

  root   'static_pages#home'
  get    '/help',    to: 'static_pages#help'
  get    '/about',   to: 'static_pages#about'
  get    '/contact', to: 'static_pages#contact'
  get    '/signup',  to: 'users#new'
  get    '/webpage', to: 'webpage#show'
  get    '/showlayout', to: 'datalayout#show'
  get    '/showlayout2', to: 'datalayout#show2'
  get    '/evaluate', to: 'evaluate#show'
  get    '/login',   to: 'sessions#new'
  post   '/login',   to: 'sessions#create'
  delete '/logout',  to: 'sessions#destroy'

  post   '/api/cnpy', to: 'cnpy_api#run'
  get    '/api/tsv', to: 'cnpy_api#get_tsv'

  resources :customapp
  resources :users do
    member do
      get :following, :followers
    end
  end
  resources :account_activations, only: [:edit]
  resources :password_resets,     only: [:new, :create, :edit, :update]
  resources :microposts,          only: [:create, :destroy]
  resources :relationships,       only: [:create, :destroy]
end
