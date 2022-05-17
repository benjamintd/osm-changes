import type { NextPage } from 'next'
import Head from 'next/head'
import useSWR from 'swr'
import Map from '../components/Map'

const Home: NextPage = () => {
  const { data } = useSWR('/api/latest-changes')

  console.log(data)

  return (
    <>
      <Head>
        <title>Live OSM changesets</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-screen h-screen">
        <Map />
      </main>
    </>
  )
}

export default Home
