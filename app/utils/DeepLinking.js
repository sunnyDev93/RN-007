const config = {
    screens: {
        Dashboard: {
            path: "Dashboard/:id",
            parse: {
                id: (id) => `${id}`,
            },
        }
    },
};

const DeepLinking = {
    prefixes: ["the007app://app"],
    config,
};

export default DeepLinking;
  