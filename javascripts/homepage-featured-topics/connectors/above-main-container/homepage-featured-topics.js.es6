import { ajax } from "discourse/lib/ajax";
import Category from "discourse/models/category";
import { withPluginApi } from "discourse/lib/plugin-api";

const CLASS_NAME = "homepage-categories";

export default {
  setupComponent(args, component) {
    const topMenuRoutes = Discourse.SiteSettings.top_menu
      .split("|")
      .filter(Boolean)
      .map((route) => `/${route}`);

    const homeRoute = topMenuRoutes[0];

    withPluginApi("0.1", (api) => {
      api.onPageChange((url) => {
        const isHomePage =
          url === "/" || url.match(/^\/\?/) || url === homeRoute;

        let showBannerHere;
        if (settings.show_on === "homepage") {
          showBannerHere = isHomePage;
        } else if (settings.show_on === "top_menu") {
          showBannerHere = topMenuRoutes.indexOf(url) > -1 || isHomePage;
        } else {
          showBannerHere =
            url.match(/.*/) && !url.match(/search.*/) && !url.match(/admin.*/);
        }

        if (showBannerHere) {
          document.querySelector("html").classList.add(CLASS_NAME);

          component.setProperties({
            displayHomepageFeatured: true,
            loadingFeatures: true,
          });

          const titleElement = document.createElement("h2");
          titleElement.innerHTML = settings.title_text;
          component.set("titleElement", titleElement);

          const descriptionElement = document.createElement("p");
          descriptionElement.innerHTML = settings.description_text;
          component.set("descriptionElement", descriptionElement);

          ajax(`/categories.json`)
            .then((result) => {
              let customFeaturedCategories = [];
              result.category_list.categories.forEach((category) =>
                customFeaturedCategories.push(Category.create(category))
              );
              console.log("customFeaturedCategories", customFeaturedCategories);
              component.set(
                "customFeaturedCategories",
                customFeaturedCategories
              );
            })
            .finally(() => component.set("loadingFeatures", false))
            .catch((e) => {
              if (e.jqXHR && e.jqXHR.status === 404) {
                document.querySelector("html").classList.remove(CLASS_NAME);
                component.set("displayHomepageFeatured", false);
              }
            });
        } else {
          document.querySelector("html").classList.remove(CLASS_NAME);
          component.set("displayHomepageFeatured", false);
        }

        if (settings.show_for === "everyone") {
          component.set("showFor", true);
        } else if (
          settings.show_for === "logged_out" &&
          !api.getCurrentUser()
        ) {
          component.set("showFor", true);
        } else if (settings.show_for === "logged_in" && api.getCurrentUser()) {
          component.set("showFor", true);
        } else {
          component.set("showFor", false);
          document.querySelector("html").classList.remove(CLASS_NAME);
        }
      });
    });
  },
};
