import type { AppProps } from 'next/app'
import { SWRConfig } from 'swr'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 3000,
        fetcher: (resource, init) =>
          fetch(resource, init).then((res) => res.text()),
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  )
}

export default MyApp
